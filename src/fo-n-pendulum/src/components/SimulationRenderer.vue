<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'

const props = defineProps(['width', 'height'])
const canvas = ref(null)
const animationLoop = ref(null)
const theme = useTheme()

const displayAreaSize = ref(2)
const scale = computed(
    () => Math.min(props.height, props.height) / displayAreaSize.value
) // pixels per meter

const pendulumLength = ref(5)
const pendulumArmLength = ref(0.1)
const pendulumState = ref([0, 0, 0, 0, 0])

onMounted(() => {
    const animate = () => {
        render()

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

const renderCircle = (x, y, radius, ctx) => {
    const [renderX, renderY] = translateCoordinates([x, y])
    const renderRadius = translateLength(radius)

    ctx.strokeStyle = 'transparent'
    ctx.fillStyle = theme.current.value.colors.secondary
    ctx.beginPath()
    ctx.arc(renderX, renderY, renderRadius, 0, 2 * Math.PI, false)
    ctx.fill()
    ctx.stroke()
}

const renderLine = (point1, point2, width, ctx) => {
    const renderPoint1 = translateCoordinates(point1)
    const renderPoint2 = translateCoordinates(point2)
    const renderWidth = translateLength(width)

    ctx.beginPath()

    ctx.strokeStyle = 'white'
    ctx.lineWidth = renderWidth
    ctx.beginPath()
    ctx.moveTo(renderPoint1[0], renderPoint1[1])
    ctx.lineTo(renderPoint2[0], renderPoint2[1])
    ctx.stroke()
}

const render = () => {
    const ctx = canvas.value.getContext('2d')

    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // render pendulum
    let x = 0
    let y = 0

    for (const theta of pendulumState.value) {
        const prevX = x
        const prevY = y

        x += Math.sin(theta) * pendulumArmLength.value
        y += Math.cos(theta) * pendulumArmLength.value

        renderLine([prevX, prevY], [x, y], 0.01, ctx)
        renderCircle(prevX, prevY, 0.02, ctx)
    }
    renderCircle(x, y, 0.02, ctx)

    // updating test
    pendulumState.value = pendulumState.value.map(
        (theta, i) => theta + 0.01 * (i + 1)
    )
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
