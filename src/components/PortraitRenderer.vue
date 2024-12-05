<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
import { usePendulumStore } from '@/stores/pendulum'
import Konva from 'konva'

const props = defineProps(['width', 'height'])

const layer = ref(null)
let animation = null
let backgroundCanvas = null

const pendulum = usePendulumStore()

const displayAreaSize = computed(() => 20)
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

const renderLine = (point1, point2, width, color, ctx) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(point1[0], point1[1])
    ctx.lineTo(point2[0], point2[1])
    ctx.stroke()
}

const render = (delta) => {
    backgroundCanvas.width = props.width
    backgroundCanvas.height = props.height
    let ctx = backgroundCanvas.getContext('2d')

    if (pendulum.phasePortrait.angles.length > 0) {
        const scaleTmp = toRaw(scale.value)
        const widthTmp = toRaw(props.width)
        const heightTmp = toRaw(props.height)
        const phasePortrait = toRaw(pendulum.phasePortrait)

        let lastPoint = [
            phasePortrait.angles[0] * scaleTmp + widthTmp / 2,
            phasePortrait.velocities[0] * scaleTmp + heightTmp / 2,
        ]
        for (let i = 1; i < phasePortrait.angles.length; i++) {
            let currentPoint = [
                phasePortrait.angles[i] * scaleTmp + widthTmp / 2,
                phasePortrait.velocities[i] * scaleTmp + heightTmp / 2,
            ]
            renderLine(
                lastPoint,
                currentPoint,
                2,
                `rgba(255,${255 * (1 - i / phasePortrait.angles.length)},${100 + 155 * (1 - i / phasePortrait.angles.length)},${i / phasePortrait.angles.length})`,
                ctx
            )
            lastPoint = currentPoint
        }
    }

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
            <konva-circle
                :config="{
                    x: translateX(pendulum.phasePortrait.angles.at(-1)),
                    y: translateY(pendulum.phasePortrait.velocities.at(-1)),
                    radius: 5,
                    fill: 'white',
                    stroke: 'transparent',
                    draggable: i !== 0,
                }"
            />
        </konva-layer>
    </konva-stage>
</template>
