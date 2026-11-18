import express from 'express';
import { Store } from './store.mjs';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // 演示环境：通过 x-role 头区分规划员 / 审查人 / 公众，默认规划员
  app.use((req, _res, next) => {
    const role = req.header('x-role');
    req.role = role === 'reviewer' || role === 'public' ? role : 'planner';
    next();
  });

  const STATUS = ['draft', 'submitted', 'published'];

  // ---------- 方案 ----------
  app.get('/api/plans', async (req, res) => {
    const rows = await Store.list('plans');
    const slim = rows
      .map(({ scene, ...rest }) => rest) // 列表不返回大体积场景数据
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    res.json(slim);
  });

  app.get('/api/plans/:id', async (req, res) => {
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    res.json(plan);
  });

  function validateScene(scene) {
    if (!scene || typeof scene !== 'object') return 'scene 必须是对象';
    if (!Array.isArray(scene.buildings) || !Array.isArray(scene.lights)) return 'scene.buildings / scene.lights 必须是数组';
    return null;
  }

  app.post('/api/plans', async (req, res) => {
    if (req.role !== 'planner') return res.status(403).json({ error: '仅规划员可新建方案' });
    const { name, district, scene } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: '方案名称必填' });
    const sceneErr = validateScene(scene);
    if (sceneErr) return res.status(400).json({ error: sceneErr });
    const plan = await Store.insert('plans', {
      name,
      district: district || '未命名街坊',
      status: 'draft',
      round: 1, // 审查轮次：每次送审 +1，用于区分历史退回与当前轮次意见
      scene,
      stats: null,
    });
    res.status(201).json(plan);
  });

  app.put('/api/plans/:id', async (req, res) => {
    if (req.role !== 'planner') return res.status(403).json({ error: '仅规划员可编辑方案' });
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    if (plan.status !== 'draft') {
      return res.status(409).json({ error: `方案处于「${statusLabel(plan.status)}」状态，需退回草稿后才能编辑` });
    }
    const { name, district, scene } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.name = String(name);
    if (district !== undefined) patch.district = String(district);
    if (scene !== undefined) {
      const sceneErr = validateScene(scene);
      if (sceneErr) return res.status(400).json({ error: sceneErr });
      patch.scene = scene;
    }
    res.json(await Store.update('plans', plan.id, patch));
  });

  app.post('/api/plans/:id/transition', async (req, res) => {
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    const { to } = req.body || {};
    if (!STATUS.includes(to)) return res.status(400).json({ error: '目标状态非法' });

    const transitions = {
      draft: { submitted: 'planner', published: null },
      submitted: { draft: 'reviewer', published: 'reviewer' },
      published: { draft: 'reviewer' },
    };
    const needRole = transitions[plan.status]?.[to];
    if (!needRole) return res.status(409).json({ error: `不能从「${statusLabel(plan.status)}」转到「${statusLabel(to)}」` });
    if (req.role !== needRole) return res.status(403).json({ error: `该流转仅 ${roleLabel(needRole)} 可操作` });

    // 每次重新送审开启新一轮，历史退回意见不再阻塞
    const patch = { status: to };
    if (to === 'submitted') patch.round = (plan.round || 1) + (plan.status === 'draft' ? 1 : 0);

    if (to === 'published' && plan.status === 'submitted') {
      const reviews = await Store.list('reviews');
      const currentRound = plan.round || 1;
      const blocking = reviews.filter((r) => r.planId === plan.id &&
        r.outcome === 'reject' && (r.round || 1) === currentRound);
      if (blocking.length > 0) {
        return res.status(409).json({ error: '本轮审查存在退回意见，请先退回草稿修改后重新送审' });
      }
    }
    res.json(await Store.update('plans', plan.id, patch));
  });

  app.delete('/api/plans/:id', async (req, res) => {
    if (req.role !== 'planner') return res.status(403).json({ error: '仅规划员可删除方案' });
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    if (plan.status !== 'draft') return res.status(409).json({ error: '仅草稿状态可删除' });
    await Store.remove('plans', plan.id);
    res.status(204).end();
  });

  // ---------- 审查意见 ----------
  app.get('/api/plans/:id/reviews', async (req, res) => {
    const rows = (await Store.list('reviews'))
      .filter((r) => r.planId === req.params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json(rows);
  });

  app.post('/api/plans/:id/reviews', async (req, res) => {
    if (req.role !== 'reviewer') return res.status(403).json({ error: '仅审查人可填写意见' });
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    if (plan.status !== 'submitted') return res.status(409).json({ error: '仅送审中的方案可审查' });
    const { outcome, comment, reviewer } = req.body || {};
    if (!['approve', 'reject'].includes(outcome)) return res.status(400).json({ error: 'outcome 必须是 approve / reject' });
    if (!comment || !String(comment).trim()) return res.status(400).json({ error: '审查意见不能为空' });
    const review = await Store.insert('reviews', {
      planId: plan.id,
      round: plan.round || 1,
      outcome,
      comment: String(comment),
      reviewer: reviewer ? String(reviewer) : '审查人',
    });
    // 退回：方案自动回到草稿，规划员据此修改
    if (outcome === 'reject') {
      await Store.update('plans', plan.id, { status: 'draft' });
    }
    res.status(201).json(review);
  });

  // ---------- 公示批注（标点） ----------
  app.get('/api/plans/:id/annotations', async (req, res) => {
    const rows = (await Store.list('annotations'))
      .filter((a) => a.planId === req.params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    res.json(rows);
  });

  app.post('/api/plans/:id/annotations', async (req, res) => {
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    if (plan.status !== 'published') return res.status(409).json({ error: '仅公示中的方案可批注' });
    const { x, y, text, author } = req.body || {};
    if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ error: '批注坐标 x / y 必须是数字' });
    }
    if (!text || !String(text).trim()) return res.status(400).json({ error: '批注内容不能为空' });
    const note = await Store.insert('annotations', {
      planId: plan.id,
      x, y,
      text: String(text),
      author: author ? String(author) : (req.role === 'reviewer' ? '审查人' : '公众'),
    });
    res.status(201).json(note);
  });

  // ---------- 街坊统计 ----------
  app.get('/api/plans/:id/stats', async (req, res) => {
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    res.json(plan.stats || { blocks: [], generatedAt: null });
  });

  app.put('/api/plans/:id/stats', async (req, res) => {
    if (req.role !== 'planner') return res.status(403).json({ error: '仅规划员可回传统计' });
    const plan = await Store.get('plans', req.params.id);
    if (!plan) return res.status(404).json({ error: '方案不存在' });
    const stats = req.body;
    if (!stats || !Array.isArray(stats.blocks)) return res.status(400).json({ error: '统计结构非法' });
    const saved = await Store.update('plans', plan.id, {
      stats: { ...stats, generatedAt: new Date().toISOString() },
    });
    res.json(saved.stats);
  });

  // ---------- 健康检查 ----------
  app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  return app;
}

function statusLabel(s) {
  return { draft: '草稿', submitted: '送审', published: '公示' }[s] || s;
}
function roleLabel(r) {
  return { planner: '规划员', reviewer: '审查人', public: '公众' }[r] || r;
}
