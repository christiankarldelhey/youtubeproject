<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  LogOut,
  Settings,
  User,
} from 'lucide-vue-next'
import LoginDialog from './LoginDialog.vue';
import SettingsDialog from './SettingsDialog.vue';
import type { User as UserType } from "firebase/auth";
import { ref } from 'vue';

const props = defineProps<{ user: UserType | null }>();

let type = 'Login';
const loginDialogOpen = ref(false);
const settingsDialogOpen = ref(false);

const manageSettingsDialog = (value: boolean) => {
  console.log('que pacha', value);
  settingsDialogOpen.value = value;
};

const manageLoginDialog = (value: boolean, newType: string) => {
  type = newType;
  loginDialogOpen.value = value;
};

const emit = defineEmits(['close']);

</script>

<template>
  <template v-if="props.user">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
      <Avatar 
        class="absolute z-9999 right-1 top-5 transform -translate-x-1/2 border text-sm bg-white text-primary border cursor-pointer">
          <AvatarImage src="/src/assets/user.svg" alt="user" />
          <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="mr-4 mt-2 w-48 z-9999 bg-background ">
        <DropdownMenuLabel>{{ user?.email }}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User class="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem @click="manageSettingsDialog(true)">
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut class="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </template>

  <template v-else>
    <div class="absolute z-9999 right-5 top-5">
      <div class="flex flex-row justify-between gap-1">
        <Button 
        variant="default"
        @click="manageLoginDialog(true, 'Login')" 
        class="border text-sm bg-white text-primary border cursor-pointer">
        Login
      </Button>
      <Button 
        variant="default"
        @click="manageLoginDialog(true, 'Sign up')" 
        class="border text-sm bg-white text-primary border cursor-pointer">
        Sign Up
      </Button>
      </div>
    </div>
  </template>
  <LoginDialog 
    :open="loginDialogOpen" 
    @close="manageLoginDialog(false, 'Login')"
    :type="type" />
  <SettingsDialog 
    :open="settingsDialogOpen" 
    @close="manageSettingsDialog(false)" />
</template>