// 导出：OBJ(+MTL)、glTF 2.0 二进制 GLB、配色表 CSV、交付 ZIP
import type { Material } from '../types';
import type { MeshResult } from './Mesher';
import type { VoxelGrid } from './VoxelGrid';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** OBJ + MTL */
export function exportOBJ(mesh: MeshResult, materials: Material[], modelName = 'geo_voxel'): { obj: Blob; mtl: Blob } {
  const used = new Set<number>();
  for (const f of mesh.faces) used.add(f.materialId);
  const matList = materials.filter((m) => used.has(m.id));

  const mtlLines: string[] = ['# 地层材质库'];
  for (const m of matList) {
    const [r, g, b] = hexToRgb(m.color);
    mtlLines.push(`newmtl mat_${m.id}`, `Kd ${(r / 255).toFixed(4)} ${(g / 255).toFixed(4)} ${(b / 255).toFixed(4)}`, 'Ka 0 0 0', 'illum 1', '');
  }

  const lines: string[] = [`# 岩土三维地层体素模型 ${modelName}`, `mtllib ${modelName}.mtl`, 'o ' + modelName];
  let vBase = 1;
  let currentMat = -1;
  for (const f of mesh.faces) {
    if (f.materialId !== currentMat) {
      lines.push(`usemtl mat_${f.materialId}`);
      currentMat = f.materialId;
    }
    for (const v of f.vertices) lines.push(`v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}`);
    lines.push(`f ${vBase} ${vBase + 1} ${vBase + 2}`, `f ${vBase} ${vBase + 2} ${vBase + 3}`);
    vBase += 4;
  }
  return {
    obj: new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }),
    mtl: new Blob([mtlLines.join('\n')], { type: 'text/plain;charset=utf-8' })
  };
}

/** 配色表 CSV */
export function exportColorTable(materials: Material[], grid: VoxelGrid): Blob {
  const counts = grid.countByMaterial(materials);
  const rows: string[] = ['材质ID,名称,颜色HEX,R,G,B,体素数,体积(m3)'];
  for (const m of materials) {
    const [r, g, b] = hexToRgb(m.color);
    const n = counts.get(m.id) ?? 0;
    rows.push(`${m.id},"${m.name}",${m.color},${r},${g},${b},${n},${(n * grid.cell ** 3).toFixed(2)}`);
  }
  return new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
}

const align4 = (n: number): number => (n + 3) & ~3;

/** glTF 2.0 GLB：按材质分组，POSITION / NORMAL / indices 三个 accessor 每组 */
export function exportGLB(mesh: MeshResult, materials: Material[], modelName = 'geo_voxel'): Blob {
  const usedMats = materials.filter((m) => mesh.faces.some((f) => f.materialId === m.id));
  const matIndex = new Map(usedMats.map((m, i) => [m.id, i]));

  const bufferChunks: ArrayBuffer[] = [];
  let bufferLen = 0;
  const pushChunk = (bytes: Uint8Array): { offset: number; length: number } => {
    const offset = bufferLen;
    bufferChunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
    bufferLen += bytes.length;
    const pad = align4(bufferLen) - bufferLen;
    if (pad > 0) {
      bufferChunks.push(new ArrayBuffer(pad));
      bufferLen += pad;
    }
    return { offset, length: bytes.length };
  };

  const bufferViews: any[] = [];
  const accessors: any[] = [];
  const primitives: any[] = [];

  for (const m of usedMats) {
    const group = mesh.faces.filter((f) => f.materialId === m.id);
    const vCount = group.length * 4;
    const pos = new Float32Array(vCount * 3);
    const nor = new Float32Array(vCount * 3);
    const idx = new Uint32Array(group.length * 6);
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];

    group.forEach((f, fi) => {
      f.vertices.forEach((v, vi) => {
        const o = (fi * 4 + vi) * 3;
        pos[o] = v.x;
        pos[o + 1] = v.y;
        pos[o + 2] = v.z;
        nor[o] = f.normal[0];
        nor[o + 1] = f.normal[1];
        nor[o + 2] = f.normal[2];
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], pos[o + k]);
          max[k] = Math.max(max[k], pos[o + k]);
        }
      });
      const b = fi * 4;
      const t = fi * 6;
      idx.set([b, b + 1, b + 2, b, b + 2, b + 3], t);
    });

    const posView = pushChunk(new Uint8Array(pos.buffer));
    const norView = pushChunk(new Uint8Array(nor.buffer));
    const idxView = pushChunk(new Uint8Array(idx.buffer));
    const viewBase = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset: posView.offset, byteLength: posView.length, target: 34962 });
    bufferViews.push({ buffer: 0, byteOffset: norView.offset, byteLength: norView.length, target: 34962 });
    bufferViews.push({ buffer: 0, byteOffset: idxView.offset, byteLength: idxView.length, target: 34963 });

    const accBase = accessors.length;
    accessors.push({ bufferView: viewBase, componentType: 5126, count: vCount, type: 'VEC3', min, max });
    accessors.push({ bufferView: viewBase + 1, componentType: 5126, count: vCount, type: 'VEC3' });
    accessors.push({ bufferView: viewBase + 2, componentType: 5125, count: idx.length, type: 'SCALAR' });
    primitives.push({
      attributes: { POSITION: accBase, NORMAL: accBase + 1 },
      indices: accBase + 2,
      material: matIndex.get(m.id)
    });
  }

  const gltfMaterials = usedMats.map((m) => {
    const [r, g, b] = hexToRgb(m.color);
    return {
      name: m.name,
      pbrMetallicRoughness: { baseColorFactor: [r / 255, g / 255, b / 255, 1], metallicFactor: 0, roughnessFactor: 0.95 },
      doubleSided: false
    };
  });

  const gltf: any = {
    asset: { version: '2.0', generator: 'geo-voxel-studio' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: modelName, mesh: 0 }],
    meshes: [{ name: modelName, primitives }],
    materials: gltfMaterials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: bufferLen }]
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(gltf));
  const jsonPad = align4(jsonBytes.length) - jsonBytes.length;
  const binPad = align4(bufferLen) - bufferLen;
  const total = 12 + 8 + jsonBytes.length + jsonPad + 8 + bufferLen + binPad;
  const out = new ArrayBuffer(total);
  const dv = new DataView(out);
  const u8 = new Uint8Array(out);
  let p = 0;
  dv.setUint32(p, 0x46546c67, true); p += 4;
  dv.setUint32(p, 2, true); p += 4;
  dv.setUint32(p, total, true); p += 4;
  dv.setUint32(p, jsonBytes.length + jsonPad, true); p += 4;
  dv.setUint32(p, 0x4e4f534a, true); p += 4;
  u8.set(jsonBytes, p); p += jsonBytes.length;
  for (let i = 0; i < jsonPad; i++) u8[p++] = 0x20;
  dv.setUint32(p, bufferLen + binPad, true); p += 4;
  dv.setUint32(p, 0x004e4942, true); p += 4;
  let bp = 0;
  for (const chunk of bufferChunks) {
    u8.set(new Uint8Array(chunk), p + bp);
    bp += chunk.byteLength;
  }
  p += bufferLen;
  for (let i = 0; i < binPad; i++) u8[p++] = 0;

  return new Blob([out], { type: 'model/gltf-binary' });
}

/** 交付 ZIP（store 不压缩，零依赖） */
export function buildDeliveryZip(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const enc = new TextEncoder();
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (data: Uint8Array): number => {
    let c = 0xffffffff;
    for (let i = 0; i < data.length; i++) c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  interface Rec {
    nameBytes: Uint8Array;
    crc: number;
    localSize: number;
    offset: number;
    dataLen: number;
    data: Uint8Array;
  }

  return (async () => {
    const recs: Rec[] = [];
    const localChunks: Uint8Array[] = [];
    let offset = 0;
    for (const f of files) {
      const data = new Uint8Array(await f.blob.arrayBuffer());
      const nameBytes = enc.encode(f.name);
      const crc = crc32(data);
      const local = new ArrayBuffer(30 + nameBytes.length);
      const dv = new DataView(local);
      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(8, 0, true);
      dv.setUint32(14, crc, true);
      dv.setUint32(18, data.length, true);
      dv.setUint32(22, data.length, true);
      dv.setUint16(26, nameBytes.length, true);
      new Uint8Array(local).set(nameBytes, 30);
      const localBytes = new Uint8Array(local);
      localChunks.push(localBytes, data);
      recs.push({ nameBytes, crc, localSize: localBytes.length + data.length, offset, dataLen: data.length, data });
      offset += localBytes.length + data.length;
    }

    const centralChunks: Uint8Array[] = [];
    let centralSize = 0;
    for (const r of recs) {
      const cd = new ArrayBuffer(46 + r.nameBytes.length);
      const dv = new DataView(cd);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 20, true);
      dv.setUint32(16, r.crc, true);
      dv.setUint32(20, r.dataLen, true);
      dv.setUint32(24, r.dataLen, true);
      dv.setUint16(28, r.nameBytes.length, true);
      dv.setUint32(42, r.offset, true);
      new Uint8Array(cd).set(r.nameBytes, 46);
      centralChunks.push(new Uint8Array(cd));
      centralSize += cd.byteLength;
    }

    const end = new ArrayBuffer(22);
    const edv = new DataView(end);
    edv.setUint32(0, 0x06054b50, true);
    edv.setUint16(8, recs.length, true);
    edv.setUint16(10, recs.length, true);
    edv.setUint32(12, centralSize, true);
    edv.setUint32(16, offset, true);

    return new Blob([...localChunks, ...centralChunks, new Uint8Array(end)] as BlobPart[], { type: 'application/zip' });
  })();
}
