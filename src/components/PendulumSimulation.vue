<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import SimulationRenderer from './SimulationRenderer.vue'
import { usePendulumStore } from '@/stores/pendulum'
const width = ref(10)
const height = ref(10)

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

const pendulum = usePendulumStore()

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
        <v-row>
            <v-col>
                <v-sheet class="container pa-2">
                    <div
                        style="width: 100%; height: 100%"
                        ref="container"
                    >
                        <SimulationRenderer
                            v-if="pendulum.displayMode === 'pendulum'"
                            :width="width"
                            :height="height"
                        />
                        <PortraitRenderer
                            v-if="pendulum.displayMode === 'portrait'"
                            :width="width"
                            :height="height"
                        />
                    </div>
                </v-sheet>
            </v-col>
            <v-col
                cols="4"
                style="min-width: 500px"
            >
                <v-sheet
                    class="flex-grow pa-8"
                    style="height: 100%"
                >
                    <v-switch
                        v-model="pendulum.doAnimate"
                        color="primary"
                        label="Animate"
                    ></v-switch>

                    <v-switch
                        :modelValue="pendulum.displayMode === 'portrait'"
                        @update:modelValue="
                            () => {
                                pendulum.displayMode =
                                    pendulum.displayMode === 'portrait'
                                        ? 'pendulum'
                                        : 'portrait'
                            }
                        "
                        color="primary"
                        label="Show portrait"
                    ></v-switch>

                    <div>Pendulum links</div>
                    <v-slider
                        v-model="pendulum.links"
                        color="primary"
                        step="1"
                        min="1"
                        max="10"
                        show-ticks
                        thumb-label
                    ></v-slider>

                    <div>Trace length</div>
                    <v-slider
                        v-model="pendulum.traceLimit"
                        color="primary"
                        step="10"
                        min="0"
                        max="500"
                        show-ticks
                        thumb-label
                    ></v-slider>

                    <v-select
                        v-model="pendulum.traceType"
                        label="Trace type"
                        :items="['none', 'tip', 'all']"
                    ></v-select>

                    <div>Gravity</div>
                    <v-slider
                        v-model="pendulum.gravConstant"
                        color="primary"
                        min="0"
                        max="30"
                        thumb-label
                    ></v-slider>
                </v-sheet>
            </v-col>
        </v-row>
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
