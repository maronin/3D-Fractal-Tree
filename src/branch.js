import * as THREE from 'three'

/**
 * Branch class
 */
export default class Branch {

    constructor(endPos, rad, length, color, name, last = false) {
        this.pos = new THREE.Vector3()
        this.length = length
        this.endPos = new THREE.Vector3(this.pos.x, this.pos.y + this.length, this.pos.z)

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
        branch.position.y += length / 2
        branch.name = "branchMesh"
        this.meshGroup.add(branch)
        this.meshGroup.position.copy(endPos)

    }
}