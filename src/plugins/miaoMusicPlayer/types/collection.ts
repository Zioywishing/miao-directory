import type { audioType } from './ap'

export type collectionItemType = {} & audioType

export type collectionType = {
  id: number
  name: string
  intro: string
  createTime: Date
  coverUrl?: string
  audios: collectionItemType[]
}

export default collectionType
