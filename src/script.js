import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { Vector3 } from 'three'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.width = 350


// Canvas
const canvas = document.querySelector('canvas.webgl')


// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x2a2a2a);

const guiLightsFolder = gui.addFolder("Lights")

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
guiLightsFolder.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
scene.add(ambientLight)


// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.position.set(2, 2, -1)
guiLightsFolder.add(directionalLight, 'intensity').min(0).max(1).step(0.001)
guiLightsFolder.add(directionalLight.position, 'x').min(-5).max(5).step(0.001)
guiLightsFolder.add(directionalLight.position, 'y').min(-5).max(5).step(0.001)
guiLightsFolder.add(directionalLight.position, 'z').min(-5).max(5).step(0.001)
scene.add(directionalLight)


/**
 * Materials
 */
const material = new THREE.MeshStandardMaterial()
const treeMaterial = new THREE.MeshNormalMaterial()

/**
 * Plane
 */
const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(60, 60),
    material
)
plane.rotation.x = -Math.PI * 0.5
scene.add(plane)


/**
 * Axes helper
 */
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Tree properties
 */
const treeProperties = {
    stemToStemRatio: 0.8,
    stemToBranchRatio: 0.5,
    depth: 6,
    angle: 60,
    scatterAngle: 0,
    branches: 6,
    branchLength: 30
}


/** 
 * Tree Group
 */
const tree = new THREE.Group()

/**
 * Clear the tree and dispose of the children
 */
const clearTree = () => {
    tree.children.forEach(child => {
        child.geometry.dispose()
    });
    tree.remove(...tree.children);
}



const generateTree = () => {
    console.log("generate tree");

    clearTree()
    const makeBranch = (currentDepth, branchLength, rootPos) => {
        if (currentDepth >= treeProperties.depth) return

        const branchEndPos = new THREE.Vector3(0, rootPos.y + branchLength, 0)
        const stemPath = new THREE.LineCurve3(rootPos, branchEndPos);

        const stemColor = new THREE.Color(0, 1 - currentDepth / treeProperties.depth, 0)
        const stem = new THREE.Mesh(
            new THREE.TubeBufferGeometry(stemPath, 20, 0.5, 8, false),
            new THREE.MeshBasicMaterial({ color: stemColor })
        )

        branchLength = branchLength * treeProperties.stemToBranchRatio

        makeBranch(++currentDepth, branchLength, branchEndPos)
        tree.add(stem)
    }

    makeBranch(0, treeProperties.branchLength, new THREE.Vector3(0, 0, 0))

}

scene.add(tree)
generateTree()


/**
 * Tree Properties UI
 */
const guiTreePropertiesFolder = gui.addFolder("Tree Properties")
guiTreePropertiesFolder.open()
guiTreePropertiesFolder.add(treeProperties, "branchLength").min(0).max(50).step(.1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "stemToStemRatio").min(0.1).max(0.8).step(0.1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "stemToBranchRatio").min(0.4).max(0.9).step(0.1).onChange(generateTree)

guiTreePropertiesFolder.add(treeProperties, "angle").min(30).max(60).step(5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "scatterAngle").min(0).max(360).step(5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "depth").min(0).max(5).step(1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "branches").min(3).max(10).step(1).onChange(generateTree)



window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.x = 0
camera.position.y = 20
camera.position.z = 85
scene.add(camera)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
// controls.enablePan = false;


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()