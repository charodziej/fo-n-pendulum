import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'

export const usePendulumStore = defineStore('pendulum', () => {
    const links = ref(7)
    const armLength = ref(0.1)

    const angle = ref([])
    const angularVelocity = ref([])

    const trace = ref([])
    const traceLimit = ref(300)

    let lastTimestamp = null

    const position = computed(() => {
        const result = [[0, 0]]
        let x = 0
        let y = 0

        for (const theta of angle.value) {
            x += Math.sin(theta) * armLength.value
            y += Math.cos(theta) * armLength.value

            result.push([x, y])
        }

        return result
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
        angle.value = angle.value.map(
            (theta, i) => theta + 1 * timeDelta * (i + 1)
        )

        trace.value.push(toRaw(position.value))
        if (trace.value.length > traceLimit.value) {
            trace.value.shift()
        }
    }

    const tick = (timestamp) => {
        if (lastTimestamp) {
            const timeDelta = timestamp - lastTimestamp

            simulationTick(timeDelta / 1000)
        }
        lastTimestamp = timestamp
    }

    return {
        links,
        armLength,
        position,
        angle,
        angularVelocity,
        trace,
        tick,
    }
})
