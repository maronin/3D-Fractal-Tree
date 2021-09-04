import * as THREE from 'three'

/**
 * Branch class
 */
export default class Branch {

    constructor(endPos, length, color, name) {
        this.pos = new THREE.Vector3()
        this.length = length
        this.endPos = new THREE.Vector3(this.pos.x, this.pos.y + this.length, this.pos.z)
        this.branchPath = new THREE.LineCurve3(this.pos, this.endPos)


        this.meshGroup = new THREE.Group()
        this.meshGroup.name = name

        const standardMaterial = new THREE.MeshStandardMaterial({ color: color })

        const tubeGeometry = new THREE.TubeGeometry(this.branchPath, 1, 1, 8)

        const cylinder = new THREE.CylinderBufferGeometry(2, 2, length, 10, 1)
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