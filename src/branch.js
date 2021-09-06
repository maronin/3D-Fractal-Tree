import * as THREE from 'three'

/**
 * Branch class using a cylinder that tapers towards the end.
 */
export default class Branch {

    /**
     * @param {THREE.Vector3} endPos 
     * @param {float} rad 
     * @param {float} length 
     * @param {THREE.Color} color 
     * @param {string} name 
     * @param {boolean} last 
     */
    constructor(endPos, rad, length, color, name, last = false) {

        this.length = length
        this.endPos = new THREE.Vector3(0, this.length, 0)
        this.endRad = rad * 0.80
        this.meshGroup = new THREE.Group()
        this.meshGroup.name = name

        const standardMaterial = new THREE.MeshStandardMaterial({ color: color })
        if (last) {
            this.endRad = rad * 0.2
        }

        const cylinder = new THREE.CylinderBufferGeometry(Math.max(this.endRad, 0.1), rad, length, 8, 1)
        const branch = new THREE.Mesh(
            cylinder,
            standardMaterial
        )

        // Need to offset because cylinder is drawn from its center
        branch.position.y += length / 2
        branch.name = "branchMesh"

        // Add the branch to the group and copy the end position
        this.meshGroup.add(branch)
        this.meshGroup.position.copy(endPos)

    }
}