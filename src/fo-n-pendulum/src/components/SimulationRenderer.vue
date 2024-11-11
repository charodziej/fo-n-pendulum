<script setup>
import { usePendulumStore } from '@/stores/pendulum'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps(['width', 'height'])
const canvas = ref(null)
const animationLoop = ref(null)
const theme = useTheme()

const pendulum = usePendulumStore()

const displayAreaSize = computed(
    () => 2 * (pendulum.links + 1) * pendulum.armLength
)
const scale = computed(
    () => Math.min(props.height, props.height) / displayAreaSize.value
) // pixels per meter

onMounted(() => {
    const animate = (timestamp) => {
        render(timestamp)

        animationLoop.value = requestAnimationFrame(animate)
    }
    animationLoop.value = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(animationLoop.value)
})

const translateCoordinates = ([x, y]) => {
    const displayX = x * scale.value + props.width / 2
    const displayY = y * scale.value + props.height / 2

    return [displayX, displayY]
}

const translateLength = (length) => {
    return length * scale.value
}

const renderCircle = ([x, y], radius, color, ctx) => {
    const [renderX, renderY] = translateCoordinates([x, y])
    const renderRadius = translateLength(radius)

    ctx.strokeStyle = 'transparent'
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(renderX, renderY, renderRadius, 0, 2 * Math.PI, false)
    ctx.fill()
    ctx.stroke()
}

const renderLine = (point1, point2, width, color, ctx) => {
    const renderPoint1 = translateCoordinates(point1)
    const renderPoint2 = translateCoordinates(point2)
    const renderWidth = translateLength(width)

    ctx.strokeStyle = color
    ctx.lineWidth = renderWidth
    ctx.beginPath()
    ctx.moveTo(renderPoint1[0], renderPoint1[1])
    ctx.lineTo(renderPoint2[0], renderPoint2[1])
    ctx.stroke()
}

const render = (timestamp) => {
    const ctx = canvas.value.getContext('2d')

    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // render trace
    for (let j = 0; j < pendulum.position.length; j++) {
        for (let i = 1; i < pendulum.trace.length; i++) {
            renderLine(
                pendulum.trace[i - 1][j],
                pendulum.trace[i][j],
                (0.002 * i) / pendulum.trace.length,
                `rgba(255,${255 * (1 - j / pendulum.position.length)},${100 + 155 * (1 - j / pendulum.position.length)},${i / pendulum.trace.length})`,
                ctx
            )
        }
    }

    // render pendulum
    for (let i = 1; i < pendulum.position.length; i++) {
        renderLine(
            pendulum.position[i - 1],
            pendulum.position[i],
            0.01,
            'white',
            ctx
        )
        renderCircle(
            pendulum.position[i - 1],
            0.02,
            theme.current.value.colors.secondary,
            ctx
        )
    }
    renderCircle(
        pendulum.position[pendulum.position.length - 1],
        0.02,
        theme.current.value.colors.secondary,
        ctx
    )

    // updating test
    pendulum.tick(timestamp)
}
</script>
<template>
    <canvas
        :width="props.width"
        :height="props.height"
        ref="canvas"
        class="canvas"
    />
</template>
