<script setup>
import { computed, onBeforeUnmount, onMounted, ref, toRaw } from 'vue'
import { usePendulumStore } from '@/stores/pendulum'
import { useTheme } from 'vuetify'
import Konva from 'konva'

const props = defineProps(['width', 'height'])
const theme = useTheme()

const layer = ref(null)
let animation = null
let backgroundCanvas = null

const pendulum = usePendulumStore()
const doAnimate = ref(false)
let startAnimationTimeout = null

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

    // render trace
    if (pendulum.trace.length > 0) {
        //
        const scaleTmp = toRaw(scale.value)
        const widthTmp = toRaw(props.width)
        const heightTmp = toRaw(props.height)
        const traceTmp = toRaw(pendulum.trace)
        const linkCount = toRaw(pendulum.links)
        for (let j = 1; j < linkCount + 1; j++) {
            let lastPoint = [
                traceTmp[0][j][0] * scaleTmp + widthTmp / 2,
                traceTmp[0][j][1] * scaleTmp + heightTmp / 2,
            ]
            for (let i = 1; i < traceTmp.length; i++) {
                let currentPoint = [
                    traceTmp[i][j][0] * scaleTmp + widthTmp / 2,
                    traceTmp[i][j][1] * scaleTmp + heightTmp / 2,
                ]
                renderLine(
                    lastPoint,
                    currentPoint,
                    2,
                    `rgba(255,${255 * (1 - j / linkCount)},${100 + 155 * (1 - j / linkCount)},${i / traceTmp.length})`,
                    ctx
                )
                lastPoint = currentPoint
            }
        }
    }

    if (doAnimate.value) pendulum.tick(delta)
    pendulum.updateTrace()
}

const dragStart = () => {
    doAnimate.value = false
    if (startAnimationTimeout) {
        clearTimeout(startAnimationTimeout)
        startAnimationTimeout = null
    }
}
const dragMove = (index, event) => {
    const x = (event.target.attrs.x - props.width / 2) / scale.value
    const y = (event.target.attrs.y - props.height / 2) / scale.value

    pendulum.fabrikMove(index, x, y)
    event.target.setAbsolutePosition({
        x: translateX(pendulum.position[index][0]),
        y: translateY(pendulum.position[index][1]),
    })
}
const dragEnd = () => {
    startAnimationTimeout = setTimeout(() => {
        doAnimate.value = true
        startAnimationTimeout = null
    }, 2000)
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
                    draggable: i !== 0,
                }"
                @dragstart="(event) => dragStart(i, event)"
                @dragmove="(event) => dragMove(i, event)"
                @dragend="(event) => dragEnd(i, event)"
            />
        </konva-layer>
    </konva-stage>
</template>
