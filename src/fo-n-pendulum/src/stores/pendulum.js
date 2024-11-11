import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
export const usePendulumStore = defineStore('pendulum', () => {
    const links = ref(2)
    const armLength = ref(0.1)

    const angle = ref([])
    const angularVelocity = ref([])
    const angularAcceleration = ref([])

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
        [links.value],
        () => {
            angle.value = new Array(links.value).fill(0)
        },
        { immediate: true }
    )

    const tick = (timestamp) => {
        if (lastTimestamp) {
            const timeDelta = timestamp - lastTimestamp

            simulationTick(timeDelta)
        }
        lastTimestamp = timestamp
    }

    const simulationTick = (timeDelta) => {
        angle.value = angle.value.map(
            (theta, i) => theta + 0.005 * timeDelta * (i + 1)
        )
    }

    return {
        links,
        armLength,
        position,
        angle,
        angularVelocity,
        angularAcceleration,
        tick,
    }
})
