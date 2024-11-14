import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import * as math from 'mathjs'

export const usePendulumStore = defineStore('pendulum', () => {
    const links = ref(10)
    const armLength = ref(0.1)

    const angle = ref([])
    const angularVelocity = ref([])

    const trace = ref([])
    const traceLimit = ref(500)

    const position = computed({
        get() {
            const result = [[0, 0]]
            let x = 0
            let y = 0

            for (const theta of angle.value) {
                x += Math.sin(theta) * armLength.value
                y += Math.cos(theta) * armLength.value

                result.push([x, y])
            }

            return result
        },
        set(newValue) {
            let currentPos = [0, 0]
            for (let i = 1; i < newValue.length; i++) {
                angle.value[i - 1] = math.atan2(
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
            angle.value = new Array(links.value).fill(0)
            angularVelocity.value = new Array(links.value).fill(0)
        },
        { immediate: true }
    )

    const simulationTick = (timeDelta) => {
        angle.value = angle.value.map((theta, i) => theta + 1 * timeDelta)
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
        angle,
        angularVelocity,
        trace,
        tick,
        updateTrace,
        fabrikMove,
    }
})
