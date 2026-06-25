import { api } from './axios'
import { School } from '../types'

export const getPublicSchools = async (): Promise<School[]> => {
  const { data } = await api.get('/schools/public')
  return data.data
}
