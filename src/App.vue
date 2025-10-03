<script setup lang="ts">
import { ref } from 'vue'
import RaffleComponent from '@/components/RaffleComponent.vue'

const raffleRef = ref<InstanceType<typeof RaffleComponent> | null>(null)

const toggleDebug = () => {
  if (raffleRef.value) {
    raffleRef.value.toggleDebugInfo()
  }
}
</script>

<template>
  <v-app>
    <v-main class="d-flex flex-column">
      <RaffleComponent ref="raffleRef" />
      <v-spacer></v-spacer>
      <div class="bg-primary text-center pa-2 text-white d-flex align-center justify-center" style="font-size: 0.75rem; gap: 12px;">
        <span>Made by MeepsKitten with 💜 for the Whiskey Community</span>
        <v-btn
          size="x-small"
          variant="text"
          color="white"
          @click="toggleDebug"
          class="text-caption"
        >
          <v-icon size="small">mdi-bug</v-icon>
          Debug
        </v-btn>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Global styles can be added here */
</style>
