<script setup lang="ts">
import { ref } from 'vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu'
import { Button } from '@/shared/ui/shadcn/button'
import { LogOut, Languages, User, KeyRound } from 'lucide-vue-next'
import type { User as UserType } from 'firebase/auth'
import { LoginModal, useAuthSession } from '@/features/auth'
import { LanguageSelectorModal } from '@/features/language'

defineProps<{ user: UserType | null }>()

const loginDialogOpen = ref(false)
const langSelectorOpen = ref(false)
const { logout } = useAuthSession()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        :class="user ? 'text-primary' : 'border-2 border-gray-400 text-gray-400'"
        class="absolute right-3 top-4 z-9999 flex h-10 w-10 cursor-pointer items-center rounded-full bg-white px-2 hover:bg-white"
      >
        <User class="h-10 w-10" :stroke-width="2.5" />
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent class="z-9999 mr-4 mt-2 w-48 bg-white">
      <template v-if="user">
        <DropdownMenuLabel>{{ user?.email }}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem class="cursor-pointer hover:text-white" @click="langSelectorOpen = true">
            <Languages class="mr-2 h-4 w-4" />
            <span>{{ $t('language') }}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem class="cursor-pointer hover:text-white" @click="logout">
          <LogOut class="mr-2 h-4 w-4" />
          <span>{{ $t('log_out') }}</span>
        </DropdownMenuItem>
      </template>
      <template v-else>
        <DropdownMenuGroup>
          <DropdownMenuItem class="cursor-pointer hover:text-white" @click="loginDialogOpen = true">
            <KeyRound class="mr-2 h-4 w-4" />
            {{ $t('login') }}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>

  <LoginModal :open="loginDialogOpen" type="Login" @close="loginDialogOpen = false" />
  <LanguageSelectorModal :open="langSelectorOpen" @close="langSelectorOpen = false" />
</template>
