import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import Branch from './branch'
import treeProps from './treeProps'

/****************************************************************
 * Boilerplate ThreeJS stuff
 ****************************************************************/

/**
 * Canvas
 */
const canvas = document.querySelector('canvas.webgl')


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
directionalLight.position.set(2, 2, -1)


/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.x = 0
camera.position.y = 150
camera.position.z = 250


/**
 * Scene
 */
const scene = new THREE.Scene()
scene.background = new THREE.Color('black');
scene.add(camera)
scene.add(ambientLight)
scene.add(directionalLight)


/**
 * Controls - Using Orbit Controls
 */
const controls = new OrbitControls(camera, canvas)
controls.target.copy(new THREE.Vector3(0, camera.position.y, 20));
controls.update()
controls.enableDamping = true


/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Add an event listener for when the window gets resized.
 */
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


/****************************************************************
 * Dat GUI
 ****************************************************************/

const gui = new dat.GUI()
gui.width = 350

/**
 * Lights UI
 */
const guiLightsFolder = gui.addFolder("Lights")
guiLightsFolder.add(ambientLight, 'intensity').min(0).max(1).step(0.001)
guiLightsFolder.add(directionalLight, 'intensity').min(0).max(1).step(0.001)
guiLightsFolder.add(directionalLight.position, 'x').min(-5).max(5).step(0.001)
guiLightsFolder.add(directionalLight.position, 'y').min(-5).max(5).step(0.001)
guiLightsFolder.add(directionalLight.position, 'z').min(-5).max(5).step(0.001)


/**
 * Tree Properties UI
 */
const guiTreePropertiesFolder = gui.addFolder("Tree Properties")
guiTreePropertiesFolder.open()
guiTreePropertiesFolder.add(treeProps, "branchLength").min(0).max(200).step(.1).onFinishChange(generateTree).name("Branch Length")
guiTreePropertiesFolder.add(treeProps, "branchStartingThickness").min(1).max(30).step(.5).onFinishChange(generateTree).name("Branch Starting Thickness")
guiTreePropertiesFolder.add(treeProps, "stemToStemRatio").min(0.75).max(0.95).step(0.01).onFinishChange(generateTree).name("Stem to stem ratio")
guiTreePropertiesFolder.add(treeProps, "stemToBranchRatio").min(0.75).max(0.95).step(0.01).onFinishChange(generateTree).name("Stem to branch ratio")
guiTreePropertiesFolder.addColor(treeProps, "branchColor").onFinishChange(function() {
    treeProps.branchColor = new THREE.Color(treeProps.branchColor.r / 255, treeProps.branchColor.g / 255, treeProps.branchColor.b / 255)
    generateTree()
}).name("Branch Color")


// Tree angle properties
const treeAngleFolder = guiTreePropertiesFolder.addFolder("Angle Properties")
treeAngleFolder.open()
treeAngleFolder.add(treeProps, "angle").min(0).max(180).step(0.5).onFinishChange(generateTree).name("Branch Angle")
treeAngleFolder.add(treeProps, "axisRotation").min(0).max(360).step(0.5).onFinishChange(generateTree).name("Axis Rotation")
treeAngleFolder.add(treeProps, "enableRandomAxisRotation").onFinishChange(generateTree).name("Random Axis Rotation")


// Tree growth properties
const treeGrowthFolder = guiTreePropertiesFolder.addFolder("Tree Growth Values")
treeGrowthFolder.add(treeProps, "depth").min(0).max(4).step(1).onFinishChange(generateTree).name("Depth")
treeGrowthFolder.add(treeProps, "branches").min(0).max(9).step(1).onFinishChange(generateTree).name("Branches")
treeGrowthFolder.add(treeProps, "roots").onFinishChange(generateRoots).name("Roots")
treeGrowthFolder.add(treeProps, "leafs").onFinishChange(generateTree).name("Leafs")
treeGrowthFolder.open()

guiTreePropertiesFolder.add(treeProps, "animate")

if (window.innerWidth < 700) {
    gui.close()
}

/****************************************************************
 * Tree functions
 ****************************************************************/

const leafMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color("rgb(4, 36, 0)") })

/**
 * Clear the tree and dispose of the children
 */
function resetTree(tree) {
    tree.children.forEach(child => {
        if (child.type === "Group") {
            resetTree(child)
            child.remove(...child.children);
        } else if (child.type === "Mesh") {
            child.geometry.dispose()
        }
    })
}


/**
 * Recursive Branching function to generate a tree/roots
 * @param {number} depth At which depth the branch is in
 * @param {THREE.Group} parent The parent that is going to be for this branch
 * @param {THREE.Vector3} prevBranchEndPos The previous branch end position, where the branch should start from
 * @param {number} endRadius The end radius that the branch will be
 * @param {number} numBranches How many branches there should be from the current branch
 * @param {number} prevBranchLength Previous branch length used to calculate the next length of the branch
 * @param {Object} treeProps The properties to be used for the tree
 * @param {boolean} isTree Is this a tree? (Otherwise its roots, and don't draw the starting stem)
 */
function branchTree(depth, parent, prevBranchEndPos, endRadius, numBranches, prevBranchLength, treeProps, isTree = true) {

    if (depth <= treeProps.depth) {

        let stemEndRad = endRadius

        if (depth == 0 && isTree) {
            const stem = new Branch(prevBranchEndPos, endRadius, prevBranchLength, treeProps.branchColor, "stem")
            parent.add(stem.meshGroup)
            prevBranchEndPos.copy(stem.endPos)
            stemEndRad = stem.endRad
        }

        const stemPos = new THREE.Vector3()

        stemPos.copy(prevBranchEndPos)

        for (let i = 1; i <= numBranches; i++) {

            let stemLength = prevBranchLength * (Math.pow(treeProps.stemToStemRatio, i + depth))

            const stem = new Branch(stemPos, stemEndRad, stemLength, treeProps.branchColor, "stem", i == numBranches)
            if (i < numBranches) stemEndRad = stem.endRad

            const branchLength = prevBranchLength * (Math.pow(treeProps.stemToBranchRatio, i + depth))
            const branch = new Branch(stemPos, stemEndRad, branchLength, treeProps.branchColor, "branch", depth == treeProps.depth)

            // Offset the stem position for the next branch in the loop
            stemPos.y += stemLength

            if (treeProps.enableRandomAxisRotation) {
                branch.meshGroup.rotation.y = (THREE.MathUtils.randFloat(-treeProps.axisRotation, treeProps.axisRotation) * Math.PI / 180)
            } else {
                branch.meshGroup.rotation.y = i * treeProps.axisRotation * Math.PI / 180
            }

            branch.meshGroup.rotation.z = (treeProps.angle * Math.PI / 180)
            parent.add(branch.meshGroup)
            parent.add(stem.meshGroup)

            // Cursively call itself and make more branches!
            branchTree(++depth, branch.meshGroup, branch.endPos, branch.endRad, numBranches, branchLength, treeProps, isTree)
            depth--

        }

    } else {
        // Make a leaf if enabled
        if (isTree && treeProps.leafs) {
            const leaf = new THREE.Mesh(
                // You can mess around with the size of the leaf here
                new THREE.ConeBufferGeometry(depth, depth * 2, 2),
                leafMaterial
            )
            leaf.rotation.z = Math.PI
            leaf.position.copy(prevBranchEndPos)
            leaf.position.y += (depth)
            parent.add(leaf)
        }
    }
}


/**
 * Generate roots! Passing in custom parameters to the branchTree function
 */
function generateRoots() {
    resetTree(roots)
    if (treeProps.roots) {
        branchTree(0, roots, new THREE.Vector3(), treeProps.branchStartingThickness, 4, treeProps.branchLength, {
            branchLength: 10,
            branchStartingThickness: 10,
            stemToStemRatio: 0.6,
            stemToBranchRatio: 0.9,
            angle: 33,
            axisRotation: 90,
            depth: 3,
            branches: 5,
            enableRandomAxisRotation: false,
            animate: false,
            branchColor: new THREE.Color("rgb(40, 16, 0)")
        }, false)
    }
}


/**
 * Generate the tree. First reset it to avoid performance issues!
 */
function generateTree() {
    resetTree(tree)
    branchTree(0, tree, new THREE.Vector3(), treeProps.branchStartingThickness, treeProps.branches, treeProps.branchLength, treeProps)
}


/****************************************************************
 * Adding Branches with double clicks!
 ****************************************************************/

/**
 * Get the clicked branch
 * @returns the mesh geometry, group, and point for the clicked branch
 */
function getClickedBranch(event) {
    event.preventDefault();
    const raycaster = new THREE.Raycaster();
    const mousePosition = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();

    mousePosition.x = ((event.clientX - rect.left) / (rect.right - rect.left)) * 2 - 1;
    mousePosition.y = -((event.clientY - rect.top) / (rect.bottom - rect.top)) * 2 + 1;

    raycaster.setFromCamera(mousePosition, camera);
    var intersects = raycaster.intersectObjects(tree.children, true);

    if (intersects.length > 0) {
        console.log(intersects[0]);
        return {
            geometry: intersects[0].object.geometry,
            group: intersects[0].object.parent,
            point: intersects[0].point
        }
    }
}


/**
 * Add a branch on click. This gets the clicked branch and adds a new branch to the 
 * group the clicked branch belongs to. 
 */
function addBranchOnClick(event) {
    const clickedBranch = getClickedBranch(event)

    if (clickedBranch) {
        const point = clickedBranch.point
        const branchLength = clickedBranch.geometry.parameters.height
        const radiusBottom = clickedBranch.geometry.parameters.radiusBottom

        // Need to convert the point that was clicked to the local coordinates of the group of the clicked branch
        const branch = new Branch(clickedBranch.group.worldToLocal(point), radiusBottom * 0.8, branchLength, treeProps.branchColor, "newBranch", true)
        const quaternion = new THREE.Quaternion()

        // This will make the branch face towards the camera, although I there is some issues with nested groups...
        quaternion.setFromUnitVectors(clickedBranch.group.worldToLocal(point), camera.position)
        branch.meshGroup.applyQuaternion(quaternion)

        clickedBranch.group.add(branch.meshGroup)

    }
}


/**
 * Event listener for double clicking
 */
renderer.domElement.addEventListener("dblclick", addBranchOnClick, true);


/****************************************************************
 * Animation
 ****************************************************************/

/**
 * @param {THREE.Group} tree The tree that will be animated
 */
function animateTree(tree) {
    tree.children.forEach(child => {
        if (child.type === "Group") {
            animateTree(child)
            child.rotation.y += 0.01
        } else if (child.type === "Mesh") {

        }
    })
}


/**
 * Animation
 */
function animate() {

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(animate)

    if (treeProps.animate) {
        animateTree(tree)
    }

}


/****************************************************************
 * Add the plane, tree, and roots
 ****************************************************************/

/**
 * Plane
 */
const plane = new THREE.Mesh(
    new THREE.PlaneBufferGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: new THREE.Color("rgb(4, 36, 0)") })
)
plane.rotation.x = -Math.PI * 0.5
scene.add(plane)

const tree = new THREE.Object3D()
const roots = new THREE.Object3D()
scene.add(roots)
scene.add(tree)

generateRoots()
roots.rotation.z = 180 * Math.PI / 180

generateTree()

animate()