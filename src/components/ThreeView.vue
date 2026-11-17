<template>
  <div ref="host" class="three-host"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { WORKSHOP, CONVEYOR } from '../store'
import { lampModel } from '../engine/lighting'

const props = defineProps(['project'])
const host = ref(null)
let renderer, scene, camera, controls, raf = 0
let dynamic = null, hemi, dirLight

function init() {
  const el = host.value
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(50, el.clientWidth / el.clientHeight, 0.1, 200)
  camera.position.set(WORKSHOP.w / 2, 11, 13)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(WORKSHOP.w / 2, 0.5, WORKSHOP.h / 2)
  controls.enableDamping = true
  controls.maxPolarAngle = Math.PI / 2.05

  hemi = new THREE.HemisphereLight(0xffffff, 0x334455, 0.9)
  dirLight = new THREE.DirectionalLight(0xfff2dd, 1.1)
  dirLight.position.set(6, 12, 4)
  scene.add(hemi, dirLight)

  // 地面与墙
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(WORKSHOP.w, WORKSHOP.h),
    new THREE.MeshStandardMaterial({ color: 0x1a2434, roughness: 0.95 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(WORKSHOP.w / 2, 0, WORKSHOP.h / 2)
  scene.add(floor)
  const grid = new THREE.GridHelper(Math.max(WORKSHOP.w, WORKSHOP.h), Math.max(WORKSHOP.w, WORKSHOP.h), 0x2c3c55, 0x22304a)
  grid.position.set(WORKSHOP.w / 2, 0.01, WORKSHOP.h / 2)
  scene.add(grid)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a3a52, transparent: true, opacity: 0.25 })
  const mkWall = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat)
    m.position.set(x, y, z); scene.add(m)
  }
  mkWall(WORKSHOP.w, 3, 0.1, WORKSHOP.w / 2, 1.5, 0)
  mkWall(WORKSHOP.w, 3, 0.1, WORKSHOP.w / 2, 1.5, WORKSHOP.h)
  mkWall(0.1, 3, WORKSHOP.h, 0, 1.5, WORKSHOP.h / 2)
  mkWall(0.1, 3, WORKSHOP.h, WORKSHOP.w, 1.5, WORKSHOP.h / 2)

  // 输送链
  const convLen = CONVEYOR.x1 - CONVEYOR.x0
  const conv = new THREE.Mesh(
    new THREE.BoxGeometry(convLen, CONVEYOR.z, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x4a5a72, roughness: 0.7, metalness: 0.4 })
  )
  conv.position.set((CONVEYOR.x0 + CONVEYOR.x1) / 2, CONVEYOR.z / 2, CONVEYOR.y)
  scene.add(conv)

  dynamic = new THREE.Group()
  scene.add(dynamic)
  rebuild()
  animate()
}

function rebuild() {
  while (dynamic.children.length) {
    const c = dynamic.children.pop()
    c.traverse(o => { o.geometry && o.geometry.dispose(); o.material && o.material.dispose && o.material.dispose() })
  }
  const s = props.project.scheme

  for (const wp of s.workpieces) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(wp.w, wp.h, wp.d),
      new THREE.MeshStandardMaterial({ color: 0x8fa3bd, roughness: 0.55 })
    )
    m.position.set(wp.x, CONVEYOR.z + wp.h / 2, wp.y)
    dynamic.add(m)
  }

  for (const lamp of s.lamps) {
    const model = lampModel(lamp)
    const g = new THREE.Group()
    const psi = (lamp.yaw || 0) * Math.PI / 180
    // 灯管
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, model.length, 16),
      new THREE.MeshStandardMaterial({ color: 0x6a5a00, emissive: 0xffc107, emissiveIntensity: lamp.locked ? 0.5 : 1.4 })
    )
    const dir = new THREE.Vector3(Math.cos(psi), 0, Math.sin(psi))
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
    g.add(tube)
    // 反光罩
    const hood = new THREE.Mesh(
      new THREE.BoxGeometry(model.length, 0.06, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x37455c, metalness: 0.6, roughness: 0.4 })
    )
    hood.position.y = 0.1
    hood.rotation.y = -psi
    g.add(hood)
    // 吊杆
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, Math.max(0.1, 3.2 - lamp.z), 8),
      new THREE.MeshStandardMaterial({ color: 0x55657e })
    )
    pole.position.y = (3.2 - lamp.z) / 2 + 0.12
    g.add(pole)
    // 出射方向箭头
    const th = (lamp.angle || 0) * Math.PI / 180
    const D = new THREE.Vector3(-Math.sin(th) * Math.sin(psi), -Math.cos(th), Math.sin(th) * Math.cos(psi)).normalize()
    const arrow = new THREE.ArrowHelper(D, new THREE.Vector3(0, 0, 0), 0.55, 0xffd54f, 0.14, 0.08)
    g.add(arrow)
    g.position.set(lamp.x, lamp.z, lamp.y)
    dynamic.add(g)
  }

  // 白班/夜班环境
  const day = s.params.shift === 'day'
  scene.background = new THREE.Color(day ? 0x1c2a3d : 0x060a12)
  hemi.intensity = day ? 0.9 : 0.18
  dirLight.intensity = day ? 1.1 : 0.08
  dirLight.color.set(day ? 0xfff2dd : 0x8899ff)
}

function animate() {
  raf = requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function onResize() {
  const el = host.value
  if (!el || !renderer) return
  camera.aspect = el.clientWidth / el.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(el.clientWidth, el.clientHeight)
}

let ro = null
onMounted(() => {
  init()
  ro = new ResizeObserver(onResize)
  ro.observe(host.value)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro && ro.disconnect()
  renderer && renderer.dispose()
})
watch(() => props.project.scheme, rebuild, { deep: true })
</script>

<style scoped>
.three-host { flex: 1; min-height: 0; overflow: hidden; background: #060a12; }
.three-host :deep(canvas) { display: block; }
</style>
