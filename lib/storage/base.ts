// lib/storage/base.ts
import { Lieu } from "@/types/lieu";

export abstract class BaseStorage {
  abstract getAll(): Promise<Lieu[]>
  abstract getById(id: string): Promise<Lieu | null>
  abstract create(lieu: Omit<Lieu, 'id'>): Promise<Lieu>
  abstract update(id: string, lieu: Partial<Lieu>): Promise<Lieu>
  abstract delete(id: string): Promise<void>
}