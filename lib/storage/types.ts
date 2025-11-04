// lib/storage/types.ts
import { Lieu } from "@/types/lieu";

export interface StorageProvider {
  lieux: {
    getAll(): Promise<Lieu[]>
    getById(id: string): Promise<Lieu | null>
    create(lieu: Omit<Lieu, 'id'>): Promise<Lieu>
    update(id: string, lieu: Partial<Lieu>): Promise<Lieu>
    delete(id: string): Promise<void>
  }
}

// Implémentations pour localStorage et IndexedDB