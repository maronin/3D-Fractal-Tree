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
    depth: 0,
    angle: 60,
    scatterAngle: 0,
    branches: 10,
    branchLength: 30
}


const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(3, 20, 10),
    new THREE.MeshBasicMaterial({ color: 0x5C2D00 })
)
scene.add(sphere)


/**
 * Clear the tree and dispose of the children
 */
const resetTree = (tree) => {
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


        this.groupMesh = new THREE.Group()

        this.groupMesh.add(new THREE.Mesh(
            new THREE.TubeBufferGeometry(this.branchPath, 20, 0.5, 8, false),
            new THREE.MeshBasicMaterial({ color: color })
        ))
        const sphere = new THREE.Mesh(
            new THREE.SphereBufferGeometry(1, 10, 10),
            new THREE.MeshBasicMaterial({ color: color })
        )
        sphere.position.copy(this.branchEndPos)
        this.groupMesh.add(sphere)


    }
}


/** 
 * Create a branch, returning the group and end position 
 */
const createBranch = (branchLength, color, prevBranchEndPos) => {
    const branch = new Branch(new THREE.Vector3(), branchLength, color)
    const branchGroup = new THREE.Group()
    branchGroup.add(branch.groupMesh)

    // Get the start position of where the previous branch ended
    branchGroup.position.copy(prevBranchEndPos)

    return { group: branchGroup, endPos: branch.branchEndPos };
}


/**
 * Generate the tree
 */
const generateTree = () => {
    const color = new THREE.Color(0, 0.5, 0)
    const branchOff = (depth, parent, prevBranchEndPos, numBranches) => {

        if (depth < treeProperties.depth + 1) {
            console.log("----------");
            for (let i = 0; i < numBranches; i++) {


                // Reduce length by the stemToStemRatio
                let branchLength = treeProperties.branchLength //* (Math.pow(treeProperties.stemToStemRatio, i))
                let stemLength = treeProperties.branchLength * (Math.pow(treeProperties.stemToStemRatio, i))

                const stemPos = new THREE.Vector3(0, 0, 0)
                stemPos.copy(prevBranchEndPos)

                console.log(stemLength);

                // stemLength = treeProperties.branchLength

                if (i > 0) {
                    stemPos.y += treeProperties.branchLength
                }
                if (i == 2) {
                    stemPos.y += treeProperties.branchLength * 0.8
                }
                if (i == 3) {
                    stemPos.y += treeProperties.branchLength * 0.8 + treeProperties.branchLength * 0.63
                }
                if (i == 4) {
                    stemPos.y += treeProperties.branchLength * 0.8 + treeProperties.branchLength * 0.63 + treeProperties.branchLength * 0.512
                }

                stemPos.x += i * 5

                const stem = createBranch(stemLength, color, stemPos)
                parent.add(stem.group)

                // Make Branch

                ////const branch = createBranch(branchLength, color, prevBranchEndPos)
                ////branch.group.rotation.z = (treeProperties.angle * Math.PI / 180) * (i % 2 == 0 ? -1 : 1)

                // branch.group.rotation.y = THREE.MathUtils.degToRad(THREE.MathUtils.randFloat(-180, 180))

                ////parent.add(branch.group)
                ////branchOff(++depth, branch.group, branch.endPos, numBranches)
                depth--
            }

        }

    }

    resetTree(sphere)
    const trunk = createBranch(treeProperties.branchLength, new THREE.Color(0x5C2D00), new THREE.Vector3())
    sphere.add(trunk.group)

    branchOff(
        0, //curBranches
        trunk.group, // parent
        trunk.endPos, // previous branch end position
        treeProperties.branches // how deep to go
    )

}



generateTree()


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
camera.position.y = 70
camera.position.z = 100
scene.add(camera)



// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.copy(new THREE.Vector3(0, camera.position.y, 20));
controls.update()
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