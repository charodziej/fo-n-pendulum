import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import * as math from 'mathjs'

export const usePendulumStore = defineStore('pendulum', () => {
    const links = ref(2)
    const armLength = ref(0.1)
    const gravConstant = ref(9.8)

    const angles = ref([])
    const angularVelocities = ref([])

    const trace = ref([])
    const traceLimit = ref(500)

    const position = computed({
        get() {
            const result = [[0, 0]]
            let x = 0
            let y = 0

            for (const theta of angles.value) {
                x += Math.sin(theta) * armLength.value
                y += Math.cos(theta) * armLength.value

                result.push([x, y])
            }

            return result
        },
        set(newValue) {
            let currentPos = [0, 0]
            for (let i = 1; i < newValue.length; i++) {
                angles.value[i - 1] = math.atan2(
                    newValue[i][0] - currentPos[0],
                    newValue[i][1] - currentPos[1]
                )
                currentPos[0] = newValue[i][0]
                currentPos[1] = newValue[i][1]
            }
        },
    })

    watch(
        [links],
        () => {
            angles.value = new Array(links.value).fill(0)
            angularVelocities.value = new Array(links.value).fill(0)
        },
        { immediate: true }
    )

    const aMatrix = (phis) => {
        let matrix = []
        for (let i = 0; i < links.value; i++) {
            let row = []
            for (let j = 0; j < links.value; j++) {
                row.push(
                    (links.value - Math.max(i, j) + 1) *
                        Math.cos(phis[i] - phis[j])
                )
            }
            matrix.push(row)
        }
        return matrix
    }

    const rightVector = (phis, phiDots) => {
        let vector = []
        for (let i = 0; i < links.value; i++) {
            let vec_i = 0
            for (let j = 0; j < links.value; j++) {
                vec_i -=
                    (links.value - Math.max(i, j) + 1) *
                    Math.sin(phis[i] - phis[j]) *
                    phiDots[j] ** 2
            }
            vec_i -=
                gravConstant.value * (links.value - i + 1) * Math.sin(phis[i])
            vector.push(vec_i)
        }
        return vector
    }

    const solveEquationsOfMotion = (phis, phiDots) => {
        let A = aMatrix(phis)
        let b = rightVector(phis, phiDots)
        return [phiDots, math.lusolve(A, b).map((x) => x[0])]
    }

    const RK4 = (phis, phiDots, timeDelta) => {
        let k1 = solveEquationsOfMotion(phis, phiDots)
        let k2 = solveEquationsOfMotion(
            math.add(
                phis,
                k1[0].map((x) => 0.5 * timeDelta * x)
            ),
            math.add(
                phiDots,
                k1[1].map((x) => 0.5 * timeDelta * x)
            )
        )
        let k3 = solveEquationsOfMotion(
            math.add(
                phis,
                k2[0].map((x) => 0.5 * timeDelta * x)
            ),
            math.add(
                phiDots,
                k2[1].map((x) => 0.5 * timeDelta * x)
            )
        )
        let k4 = solveEquationsOfMotion(
            math.add(
                phis,
                k3[0].map((x) => 1.0 * timeDelta * x)
            ),
            math.add(
                phiDots,
                k3[1].map((x) => 1.0 * timeDelta * x)
            )
        )

        let phiDeltas = math
            .add(
                k1[0],
                k2[0].map((x) => 2 * x),
                k3[0].map((x) => 2 * x),
                k4[0]
            )
            .map((x) => (x * timeDelta) / 6)
        let phiDotDeltas = math
            .add(
                k1[1],
                k2[1].map((x) => 2 * x),
                k3[1].map((x) => 2 * x),
                k4[1]
            )
            .map((x) => (x * timeDelta) / 6)

        return [math.add(phis, phiDeltas), math.add(phiDots, phiDotDeltas)]
    }

    const simulationTick = (timeDelta) => {
        let newValues = RK4(angles.value, angularVelocities.value, timeDelta)
        angles.value = newValues[0]
        angularVelocities.value = newValues[1]
    }

    const tick = (delta) => {
        simulationTick(delta)
    }

    const updateTrace = () => {
        trace.value.push(toRaw(position.value))
        if (trace.value.length > traceLimit.value) {
            trace.value.shift()
        }
    }

    const fabrikMove = (index, x, y) => {
        const positions = toRaw(position.value)

        const forward = () => {
            positions[0] = [0, 0]
            for (let i = 0; i < positions.length - 1; i++) {
                const linkVector = math.subtract(positions[i + 1], positions[i])
                positions[i + 1] = math.add(
                    positions[i],
                    math.multiply(
                        math.divide(linkVector, math.norm(linkVector)),
                        armLength.value
                    )
                )
            }
        }
        const backward = () => {
            positions[index] = [x, y]
            for (let i = index - 1; i >= 0; i--) {
                const linkVector = math.subtract(positions[i + 1], positions[i])
                positions[i] = math.subtract(
                    positions[i + 1],
                    math.multiply(
                        math.divide(linkVector, math.norm(linkVector)),
                        armLength.value
                    )
                )
            }
        }
        backward()
        forward()

        position.value = positions
    }

    return {
        links,
        armLength,
        position,
        angle: angles,
        angularVelocity: angularVelocities,
        trace,
        tick,
        updateTrace,
        fabrikMove,
    }
})
