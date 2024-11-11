<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import SimulationRenderer from './SimulationRenderer.vue'
const width = ref(0)
const height = ref(0)

const container = ref(null)
const resizeObserver = ref(
    new ResizeObserver((entries) => {
        for (const entry of entries) {
            if (entry.contentRect) {
                const contentRect = Array.isArray(entry.contentRect)
                    ? entry.contentRect[0]
                    : entry.contentRect

                height.value = contentRect.height
                width.value = contentRect.width
            }
        }
    })
)

onMounted(() => {
    if (container.value) {
        resizeObserver.value.observe(container.value)
    }
})
onBeforeUnmount(() => {
    if (container.value) {
        resizeObserver.value.unobserve(container.value)
    }
})
</script>

<template>
    <v-container class="fill-height">
        <v-responsive
            class="align-center justify-center fill-height mx-auto flex-shrink-1"
        >
            <v-sheet class="container pa-2">
                <div
                    style="width: 100%; height: 100%"
                    ref="container"
                >
                    <SimulationRenderer
                        :width="width"
                        :height="height"
                    />
                </div>
            </v-sheet>
        </v-responsive>
    </v-container>
</template>

<style scoped>
.container {
    height: min(90vh, 90vw);
    width: min(90vh, 90vw);
}
.canvas {
    border: 1px solid black;
}
</style>
