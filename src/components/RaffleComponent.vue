<script setup lang="ts">
import { ref, computed } from 'vue'
import participantsData from '@/data/participants.json'

const showDebugInfo = ref(false)
const showParticipantsList = ref(false)

const toggleDebugInfo = () => {
  showDebugInfo.value = !showDebugInfo.value
}

const toggleParticipantsList = () => {
  showParticipantsList.value = !showParticipantsList.value
}

defineExpose({
  toggleDebugInfo
})

interface User {
  User: string
  CheckInCount: number
  LastCheckInUtc: string
}

// Parse the Users object and create weighted entries
const users = computed(() => {
  return Object.values(participantsData.Users) as User[]
})

// Create an array with each user repeated CheckInCount times for the raffle
const raffleEntries = computed(() => {
  const entries: string[] = []
  users.value.forEach(user => {
    for (let i = 0; i < user.CheckInCount; i++) {
      entries.push(user.User)
    }
  })
  return entries
})

const totalEntries = computed(() => raffleEntries.value.length)

const winner = ref<string | null>(null)
const isSpinning = ref(false)
const isSlowingDown = ref(false)
const currentName = ref<string>('')
const spinInterval = ref<number | null>(null)
const spinSpeed = 50 // milliseconds between each name change
const currentSpeed = ref(50) // current speed, starts at spinSpeed
const slowdownDuration = 3000 // 3 seconds for slowdown
const finalWinner = ref<string | null>(null)
const showFireworks = ref(false)
const showEmoteRain = ref(false)

const hasParticipants = computed(() => raffleEntries.value.length > 0)

// Emote URLs for rain effect
const emoteUrls = [
  'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_ef1a734c16844f6985cb2a6a8531ad6d/default/light/2.0',
  'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_b0b86d845c3a40f4b2822bf5ea8d81e1/default/light/2.0',
  'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_8f6aeab5fee6436ab7046130ee7e1fe1/default/light/2.0',
  'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_95f07d7e41d74ce09d7f9d60da9c2071/default/light/2.0'
]

// Get the winner's check-in count
const winnerCheckInCount = computed(() => {
  if (!winner.value) return 0
  const winnerUser = users.value.find(user => user.User === winner.value)
  return winnerUser?.CheckInCount || 0
})

const drawWinner = () => {
  if (!hasParticipants.value || isSpinning.value) return

  // Debug logging
  console.log('🎲 Starting raffle draw...')
  console.log('📊 Users:', users.value)
  console.log('🎫 Raffle entries:', raffleEntries.value)
  console.log('📈 Entry distribution:')
  users.value.forEach(user => {
    const entryCount = raffleEntries.value.filter(entry => entry === user.User).length
    const percentage = ((entryCount / raffleEntries.value.length) * 100).toFixed(1)
    console.log(`  ${user.User}: ${entryCount} entries (${percentage}%)`)
  })

  isSpinning.value = true
  isSlowingDown.value = false
  winner.value = null
  finalWinner.value = null
  currentSpeed.value = spinSpeed

  // Animate through random names
  const spin = () => {
    const randomIndex = Math.floor(Math.random() * raffleEntries.value.length)
    currentName.value = raffleEntries.value[randomIndex] || ''

    if (isSpinning.value && !isSlowingDown.value) {
      spinInterval.value = setTimeout(spin, currentSpeed.value)
    }
  }

  spin()
}

const startSlowdown = () => {
  if (!isSpinning.value || isSlowingDown.value) return

  isSlowingDown.value = true

  // Select final winner
  const winnerIndex = Math.floor(Math.random() * raffleEntries.value.length)
  finalWinner.value = raffleEntries.value[winnerIndex] || null

  console.log('🎯 Winner selected for slowdown:', finalWinner.value)

  // Start gradual slowdown
  const startTime = Date.now()
  const maxSpeed = 2000 // Maximum delay at the end (2 seconds)

  const slowdown = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / slowdownDuration, 1)

    // Exponential slowdown: speed increases exponentially
    const speedMultiplier = Math.pow(progress, 3) // Cubic curve for smooth slowdown
    currentSpeed.value = spinSpeed + (maxSpeed - spinSpeed) * speedMultiplier

    if (progress < 1) {
      // Continue slowing down
      const randomIndex = Math.floor(Math.random() * raffleEntries.value.length)
      currentName.value = raffleEntries.value[randomIndex] || ''
      spinInterval.value = setTimeout(slowdown, currentSpeed.value)
    } else {
      // Slowdown complete, reveal winner
      revealWinner()
    }
  }

  slowdown()
}

const revealWinner = () => {
  if (spinInterval.value) {
    clearTimeout(spinInterval.value)
    spinInterval.value = null
  }

  winner.value = finalWinner.value
  currentName.value = winner.value || ''
  isSpinning.value = false
  isSlowingDown.value = false
  showFireworks.value = true
  showEmoteRain.value = true

  console.log('🏆 Winner revealed:', winner.value)
}

const reset = () => {
  if (spinInterval.value) {
    clearTimeout(spinInterval.value)
    spinInterval.value = null
  }
  winner.value = null
  finalWinner.value = null
  currentName.value = ''
  isSpinning.value = false
  isSlowingDown.value = false
  currentSpeed.value = spinSpeed
  showFireworks.value = false
  showEmoteRain.value = false
}

// Generate random firework particle styles
const getFireworkStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#a29bfe', '#fd79a8', '#55efc4', '#ffeaa7']
  const angle = (index * 360) / 50 // Distribute particles in a circle
  const distance = 100 + Math.random() * 200 // Random distance 100-300px
  const duration = 1.5 + Math.random() * 1.5 // Random duration 1.5-3s
  const delay = Math.random() * 1 // Random delay 0-1s

  return {
    '--angle': `${angle}deg`,
    '--distance': `${distance}px`,
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
    backgroundColor: colors[index % colors.length],
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`
  }
}

// Generate random emote rain styles
const getEmoteRainStyle = () => {
  const duration = 3 + Math.random() * 2 // Random duration 3-5s
  const delay = Math.random() * 2 // Random delay 0-2s
  const leftPosition = Math.random() * 100 // Random horizontal position
  const rotation = Math.random() * 360 // Random rotation
  const size = 28 + Math.random() * 16 // Random size 28-44px

  return {
    '--duration': `${duration}s`,
    '--delay': `${delay}s`,
    '--rotation': `${rotation}deg`,
    left: `${leftPosition}%`,
    width: `${size}px`,
    height: `${size}px`
  }
}

// Get random emote URL from the array
const getRandomEmoteUrl = (index: number) => {
  return emoteUrls[index % emoteUrls.length]
}
</script>

<template>
  <!-- Fireworks Container - Full Screen -->
  <div v-if="showFireworks" class="fireworks-container">
    <div v-for="i in 50" :key="i" class="firework-particle" :style="getFireworkStyle(i)"></div>
  </div>

  <!-- Emote Rain Container - Full Screen -->
  <div v-if="showEmoteRain" class="emote-rain-container">
    <img
      v-for="i in 40"
      :key="i"
      :src="getRandomEmoteUrl(i)"
      class="falling-emote"
      :style="getEmoteRainStyle()"
      alt="Falling emote"
    />
  </div>

  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="elevation-12" rounded="lg">
          <v-card-title class="text-h4 text-center py-6 bg-primary">
            <span class="text-white d-flex align-center justify-center">
              <img
                src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_361de56af9e04b65ba9411b02a0a2db6/default/light/2.0"
                alt="Whiskey emote"
                class="mx-2"
                style="width: 32px; height: 32px;"
              />
              Whiskey Raffle
              <img
                src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_361de56af9e04b65ba9411b02a0a2db6/default/light/2.0"
                alt="Whiskey emote"
                class="mx-2"
                style="width: 32px; height: 32px;"
              />
            </span>
          </v-card-title>

          <v-card-text class="pa-8">
            <!-- Display Area -->
            <v-sheet
              class="d-flex align-center justify-center pa-8 rounded-lg mb-6"
              :color="isSpinning ? 'accent' : winner ? 'secondary' : 'surface'"
              min-height="200"
              elevation="2"
            >
              <div class="text-center">
                <v-fade-transition mode="out-in">
                  <div v-if="isSpinning" key="spinning">
                    <div class="text-h3 font-weight-bold spinning-text">
                      {{ currentName }}
                    </div>
                    <v-progress-circular
                      indeterminate
                      color="white"
                      size="64"
                      width="6"
                      class="mt-4"
                    ></v-progress-circular>
                  </div>
                  <div v-else-if="winner" key="winner">
                    <div class="text-h6 mb-2 d-flex align-center justify-center">
                      <img
                        src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_59fdc6ecc69040b68edc9b9627a8fbcc/default/light/2.0"
                        alt="Winner emoji"
                        class="mx-2"
                        style="width: 32px; height: 32px;"
                      />
                      Winner!
                      <img
                        src="https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_59fdc6ecc69040b68edc9b9627a8fbcc/default/light/2.0"
                        alt="Winner emoji"
                        class="mx-2"
                        style="width: 32px; height: 32px;"
                      />
                    </div>
                    <div class="text-h2 font-weight-bold winner-text">
                      {{ winner }}
                    </div>
                    <div class="text-h6 mt-3 winner-checkin-text">
                      Checked in {{ winnerCheckInCount }} {{ winnerCheckInCount === 1 ? 'time' : 'times' }}
                    </div>
                  </div>
                  <div v-else key="waiting" class="text-h5 text-grey">
                    Click the button to draw a winner!
                  </div>
                </v-fade-transition>
              </div>
            </v-sheet>

            <!-- Participant Count -->
            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-6"
            >
              Total Participants: <strong>{{ users.length }}</strong> |
              Total Entries: <strong>{{ totalEntries }}</strong>
            </v-alert>

            <!-- Debug Info -->
            <v-expand-transition>
              <v-card v-if="showDebugInfo" class="mb-6" variant="outlined" color="info">
                <v-card-title class="text-subtitle-2 py-2">
                  <v-icon start size="small">mdi-bug</v-icon>
                  Debug Info
                </v-card-title>
                <v-card-text class="text-caption">
                  <div v-for="user in users" :key="user.User" class="mb-2">
                    <strong>{{ user.User }}:</strong> {{ user.CheckInCount }} {{ user.CheckInCount === 1 ? 'entry' : 'entries' }}
                    ({{ ((raffleEntries.filter(entry => entry === user.User).length / totalEntries) * 100).toFixed(1) }}% chance)
                  </div>
                  <div class="mt-2 text-grey">
                    <strong>All entries:</strong> {{ raffleEntries.join(', ') }}
                  </div>
                </v-card-text>
              </v-card>
            </v-expand-transition>

            <!-- Action Buttons -->
            <v-row dense justify="center">
              <v-col cols="12" sm="5" md="4">
                <v-btn
                  v-if="!isSpinning"
                  block
                  size="large"
                  color="primary"
                  :disabled="!hasParticipants"
                  @click="drawWinner"
                  elevation="4"
                >
                  <v-icon start>mdi-dice-multiple</v-icon>
                  Draw
                </v-btn>
                <v-btn
                  v-else
                  block
                  size="large"
                  :color="isSlowingDown ? 'warning' : 'error'"
                  :disabled="isSlowingDown"
                  @click="startSlowdown"
                  elevation="4"
                >
                  <v-icon start>{{ isSlowingDown ? 'mdi-timer-sand' : 'mdi-stop' }}</v-icon>
                  {{ isSlowingDown ? 'Drawing...' : 'Stop!' }}
                </v-btn>
              </v-col>
              <v-col cols="12" sm="5" md="4">
                <v-btn
                  block
                  size="large"
                  color="secondary"
                  :disabled="isSpinning && !winner"
                  @click="reset"
                  elevation="4"
                >
                  <v-icon start>mdi-refresh</v-icon>
                  Reset
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Participants List -->
        <v-card class="mt-6 elevation-4" rounded="lg">
          <v-card-title
            class="bg-accent d-flex justify-space-between align-center cursor-pointer"
            @click="toggleParticipantsList"
            style="cursor: pointer;"
          >
            <span class="text-white">Participants ({{ users.length }})</span>
            <v-icon
              :class="{ 'rotate-180': showParticipantsList }"
              class="transition-transform"
              color="white"
            >
              mdi-chevron-down
            </v-icon>
          </v-card-title>
          <v-expand-transition>
            <v-card-text v-show="showParticipantsList" class="pa-4">
              <v-chip-group column>
                <v-chip
                  v-for="(user, index) in users"
                  :key="index"
                  color="primary"
                  variant="outlined"
                >
                  {{ user.User }} ({{ user.CheckInCount }} {{ user.CheckInCount === 1 ? 'entry' : 'entries' }})
                </v-chip>
              </v-chip-group>
            </v-card-text>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.spinning-text {
  color: white;
  animation: pulse 0.5s ease-in-out infinite;
}

.winner-text {
  color: white;
  animation: celebration 0.5s ease-in-out;
}

.winner-checkin-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes celebration {
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Fireworks Animation */
.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.firework-particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
  animation: explode var(--duration, 2s) ease-out var(--delay, 0s) infinite;
  transform-origin: center;
}

@keyframes explode {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--angle, 0deg)) * var(--distance, 200px)),
      calc(sin(var(--angle, 0deg)) * var(--distance, 200px))
    ) scale(0);
    opacity: 0;
  }
}

/* Emote Rain Animation */
.emote-rain-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.falling-emote {
  position: absolute;
  top: -50px;
  animation: fall var(--duration, 4s) linear var(--delay, 0s) infinite;
  opacity: 0.9;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

@keyframes fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.9;
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(calc(100vh + 50px)) rotate(var(--rotation, 360deg));
    opacity: 0;
  }
}

/* Collapsible List Styles */
.transition-transform {
  transition: transform 0.3s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>

