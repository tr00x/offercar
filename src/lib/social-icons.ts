import { 
  FaInstagram, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaYoutube, 
  FaGlobe, 
  FaTelegram, 
  FaWhatsapp, 
  FaTiktok 
} from 'react-icons/fa6'
import type { IconBaseProps } from 'react-icons'
import type { ComponentType } from 'react'

export interface SocialNetwork {
  value: string
  label: string
  icon: ComponentType<IconBaseProps & { className?: string }>
  colorClass: string
}

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { value: 'instagram', label: 'Instagram', icon: FaInstagram, colorClass: 'text-pink-600' },
  { value: 'facebook', label: 'Facebook', icon: FaFacebook, colorClass: 'text-blue-600' },
  { value: 'twitter', label: 'Twitter/X', icon: FaTwitter, colorClass: 'text-sky-500' },
  { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, colorClass: 'text-blue-700' },
  { value: 'youtube', label: 'YouTube', icon: FaYoutube, colorClass: 'text-red-600' },
  { value: 'website', label: 'Website', icon: FaGlobe, colorClass: 'text-gray-600 dark:text-gray-400' },
  { value: 'telegram', label: 'Telegram', icon: FaTelegram, colorClass: 'text-sky-500' },
  { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, colorClass: 'text-green-500' },
  { value: 'tiktok', label: 'TikTok', icon: FaTiktok, colorClass: 'text-black dark:text-white' },
]

export const getSocialIcon = (network: string) => {
  const found = SOCIAL_NETWORKS.find(n => n.value === network)
  return found ? found.icon : FaGlobe
}

export const getSocialColorClass = (network: string) => {
  const found = SOCIAL_NETWORKS.find(n => n.value === network)
  return found ? found.colorClass : 'text-gray-600'
}

export const getSocialLabel = (network: string): string => {
  const found = SOCIAL_NETWORKS.find(n => n.value === network)
  return found ? found.label : network
}
