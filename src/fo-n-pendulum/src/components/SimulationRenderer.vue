<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePendulumStore } from '@/stores/pendulum'
import { useTheme } from 'vuetify'
import Konva from 'konva'

const props = defineProps(['width', 'height'])
const theme = useTheme()

const layer = ref(null)
let animation = null
let backgroundCanvas = null

const pendulum = usePendulumStore()

const displayAreaSize = computed(
    () => 2 * (pendulum.links + 1) * pendulum.armLength
)
const scale = computed(
    () => Math.min(props.height, props.height) / displayAreaSize.value
) // pixels per meter

onMounted(() => {
    backgroundCanvas = document.createElement('canvas')

    animation = new Konva.Animation((frame) => {
        render(frame.timeDiff / 1000)
    }, layer.value.getNode())
    animation.start()
})

onBeforeUnmount(() => {
    animation.stop()
})

const translateX = (x) => x * scale.value + props.width / 2
const translateY = (y) => y * scale.value + props.height / 2
const translateLength = (length) => length * scale.value

const renderLine = (point1, point2, width, color, ctx) => {
    const renderX1 = translateX(point1[0])
    const renderY1 = translateX(point1[1])
    const renderX2 = translateX(point2[0])
    const renderY2 = translateX(point2[1])
    const renderWidth = translateLength(width)

    ctx.strokeStyle = color
    ctx.lineWidth = renderWidth
    ctx.beginPath()
    ctx.moveTo(renderX1, renderY1)
    ctx.lineTo(renderX2, renderY2)
    ctx.stroke()
}

const render = (delta) => {
    backgroundCanvas.width = props.width
    backgroundCanvas.height = props.height
    let ctx = backgroundCanvas.getContext('2d')
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

    // updating test
    pendulum.tick(delta)
}
</script>
<template>
    <konva-stage
        :config="{
            width: props.width,
            height: props.height,
        }"
    >
        <konva-layer ref="layer">
            <konva-image
                :config="{
                    image: backgroundCanvas,
                }"
            />
            <konva-line
                :config="{
                    x: 0,
                    y: 0,
                    points: pendulum.position.reduce(
                        (prev, curr) => [
                            ...prev,
                            translateX(curr[0]),
                            translateY(curr[1]),
                        ],
                        []
                    ),
                    stroke: theme.current.value.colors.secondary,
                    strokeWidth: translateLength(0.02),
                    lineJoin: 'bevel',
                }"
            />
            <konva-circle
                v-for="(position, i) in pendulum.position"
                :key="i"
                :config="{
                    x: translateX(position[0]),
                    y: translateY(position[1]),
                    radius: translateLength(0.02),
                    fill: 'white',
                    stroke: 'transparent',
                }"
            />
        </konva-layer>
    </konva-stage>
</template>
