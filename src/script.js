import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Branch from './branch'
import treeProps from './treeProps'


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
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Tree properties
 */
const maxBranchLength = 80


const sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(3, 20, 10),
    new THREE.MeshBasicMaterial({ color: 0x5C2D00 })
)
scene.add(sphere)



const greenColor = new THREE.Color(0, 0.5, 0)
const sphereForBranch = new THREE.SphereBufferGeometry(3, 10, 10)


/**
 * Clear the tree and dispose of the children
 */
const resetTree = (tree) => {
    tree.children.forEach(child => {
        if (child.type === "Group") {
            if (child.name === "trunk") return
            resetTree(child)
            child.remove(...child.children);
        } else if (child.type === "Mesh") {
            child.geometry.dispose()
        }
    })
}
const standardMaterial = new THREE.MeshStandardMaterial()

const branchOff = (depth, parent, prevBranchEndPos, endRadius, numBranches, prevBranchLength) => {

    if (depth <= treeProps.depth) {

        let stemEndRad = endRadius

        if (depth == 0) {
            const stem = new Branch(prevBranchEndPos, endRadius, prevBranchLength, greenColor, "stem")
            parent.add(stem.meshGroup)
            prevBranchEndPos.copy(stem.endPos)
            stemEndRad = stem.endRad
        }

        const stemPos = new THREE.Vector3()


        stemPos.copy(prevBranchEndPos)

        for (let i = 1; i <= numBranches; i++) {

            let branchLength2 = prevBranchLength * (Math.pow(treeProps.stemToBranchRatio, i + depth))
            let stemLength = prevBranchLength * (Math.pow(treeProps.stemToStemRatio, i + depth))

            const stem = new Branch(stemPos, stemEndRad, stemLength, greenColor, "stem", i == numBranches)
            if (i < numBranches) stemEndRad = stem.endRad

            const branch = new Branch(stemPos, stemEndRad, branchLength2, greenColor, "branch", depth == treeProps.depth)

            if (treeProps.enableRandomDeviation) {
                branch.meshGroup.rotation.y = (THREE.MathUtils.randFloat(-treeProps.branchAngleDeviation, treeProps.branchAngleDeviation) * Math.PI / 180)
            } else {
                if (i % 2 == 0) {
                    // branch.meshGroup.rotation.y = treeProps.branchAngleDeviation * Math.PI / 180
                }
                branch.meshGroup.rotation.y = i * treeProps.branchAngleDeviation * Math.PI / 180
            }
            branch.meshGroup.rotation.z = (treeProps.angle * Math.PI / 180)
            parent.add(branch.meshGroup)
            parent.add(stem.meshGroup)

            stemPos.y += stemLength

            branchOff(++depth, branch.meshGroup, branch.endPos, branch.endRad, numBranches, branchLength2)
            depth--

        }

    } else {

        const leaf = new THREE.Mesh(
            sphereForBranch,
            standardMaterial
        )
        leaf.position.copy(prevBranchEndPos)
        parent.add(leaf)
    }


}


/**
 * Generate the tree
 */
sphere.name = "trunk"
const generateTree = () => {

    resetTree(sphere)
    branchOff(
        0, //curBranches
        sphere, // parent
        new THREE.Vector3(), // previous branch end position
        10,
        treeProps.branches, // how deep to go
        treeProps.branchLength
    )

}

generateTree()


/**
 * Tree Properties UI
 */
const guiTreePropertiesFolder = gui.addFolder("Tree Properties")
guiTreePropertiesFolder.open()
guiTreePropertiesFolder.add(treeProps, "branchLength").min(0).max(200).step(.1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "stemToStemRatio").min(0.1).max(0.95).step(0.01).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "stemToBranchRatio").min(0.4).max(0.9).step(0.1).onChange(generateTree)

guiTreePropertiesFolder.add(treeProps, "angle").min(0).max(60).step(0.5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "branchAngleDeviation").min(0).max(360).step(0.5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "enableRandomDeviation").onChange(generateTree)

// guiTreePropertiesFolder.add(treeProperties, "scatterAngle").min(0).max(360).step(5).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "depth").min(0).max(5).step(1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "branches").min(0).max(40).step(1).onChange(generateTree)
guiTreePropertiesFolder.add(treeProps, "animate").onChange(generateTree)



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

    if (treeProps.animate) {
        if (treeProps.branchLength < maxBranchLength) {
            treeProps.branchLength += elapsedTime / 60

        }
        treeProps.branchAngleDeviation += elapsedTime / 60
        generateTree()
        gui.updateDisplay()
    }

}

tick()