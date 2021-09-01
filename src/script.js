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
    depth: 3,
    angle: 30,
    scatterAngle: 0,
    branches: 3,
    branchLength: 30
}


const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(3, 20, 10),
    material
)
scene.add(sphere)

/** 
 * Tree Group
 */


/**
 * Clear the tree and dispose of the children
 */
const clearTree = (tree) => {
    // tree.children.forEach(child => {
    // child.geometry.dispose()
    // });
    tree.remove(...tree.children);
}


class Branch {
    constructor(pos, length, color) {
        this.pos = pos
        this.length = length
        this.v0 = pos
        this.branchEndPos = new THREE.Vector3(this.pos.x, this.pos.y + this.length, this.pos.z)
        this.branchPath = new THREE.LineCurve3(this.v0, this.branchEndPos)
        this.mesh = new THREE.Mesh(
            new THREE.TubeBufferGeometry(this.branchPath, 20, 0.5, 8, false),
            new THREE.MeshBasicMaterial({ color: color })
        )
    }
}




const generateTree = () => {

    const makeBranch = (curBranches, parent, prevBranchEndPos, depth) => {

        if (curBranches < treeProperties.branches) {

            const branchLength = treeProperties.branchLength * (Math.pow(treeProperties.stemToStemRatio, curBranches))

            const color = new THREE.Color(0, 1 - curBranches / treeProperties.branches, 0)
            const branch = new Branch(new THREE.Vector3(), branchLength, color)
            const sphere = new THREE.Mesh(
                new THREE.SphereBufferGeometry(0.75, 20, 10),
                new THREE.MeshBasicMaterial({
                    color: 0x3B2100
                })
            )
            sphere.position.set(branch.branchEndPos.x, branch.branchEndPos.y, branch.branchEndPos.z)
            const branchGroup = new THREE.Group()

            branchGroup.rotation.z = -treeProperties.angle * Math.PI / 180
            branchGroup.add(branch.mesh)
            branchGroup.add(sphere)

            // Get the start position of where the previous branch ended
            branchGroup.position.copy(prevBranchEndPos)

            parent.add(branchGroup)

            makeBranch(++curBranches, branchGroup, branch.branchEndPos, depth)

            if (depth > 0) {
                branchGroup.rotation.z = treeProperties.angle * Math.PI / 180
                makeBranch(curBranches, branchGroup, branch.branchEndPos, --depth)
            }

        }

    }

    clearTree(sphere)
    const trunk = new Branch(new THREE.Vector3(), treeProperties.branchLength, new THREE.Color())
    const branchGroup = new THREE.Group()
    branchGroup.add(trunk.mesh)
    sphere.add(branchGroup)

    makeBranch(0, branchGroup, trunk.branchEndPos, treeProperties.depth)

}

// scene.add(tree)
generateTree()


const angle = (Math.PI * 20) / 180

/*
const branch1 = new Branch(new THREE.Vector3(), 10)
const branch1Group = new THREE.Group()
branch1Group.add(branch1.mesh)

// copy position of parent
branch1Group.position.copy(plane.position)



const branch2 = new Branch(new THREE.Vector3(), 10)
const branch2Group = new THREE.Group()

// copy position of parent
branch2Group.add(branch2.mesh)
branch2Group.position.copy(branch1.v1)

// parent adds this to group
branch1Group.add(branch2Group)


const branch3 = new Branch(new THREE.Vector3(), 10)
const branch3Group = new THREE.Group()
branch3Group.position.copy(branch2.v1)
branch3Group.add(branch3.mesh)
branch2Group.add(branch3Group)
*/




// scene.add(branch1Group)




/**
 * Tree Properties UI
 */
const guiTreePropertiesFolder = gui.addFolder("Tree Properties")
guiTreePropertiesFolder.open()
guiTreePropertiesFolder.add(treeProperties, "branchLength").min(0).max(50).step(.1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "stemToStemRatio").min(0.1).max(0.95).step(0.01).onChange(generateTree)
    // guiTreePropertiesFolder.add(treeProperties, "stemToBranchRatio").min(0.4).max(0.9).step(0.1).onChange(generateTree)

guiTreePropertiesFolder.add(treeProperties, "angle").min(0).max(60).step(0.5).onChange(generateTree)
    // guiTreePropertiesFolder.add(treeProperties, "scatterAngle").min(0).max(360).step(5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "depth").min(0).max(5).step(1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProperties, "branches").min(0).max(10).step(1).onChange(generateTree)



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
camera.position.y = 40
camera.position.z = 305
scene.add(camera)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
    // controls.enablePan = false;


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
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