/**
 * Fake Palikas Datasource
 */

import { IPalikasDatasource, Province, District, Palika } from './palikas-datasource'
import { getFakeProvinces, getFakeDistricts, getFakePalikas } from './fake-regions-datasource'

export class FakePalikasDatasource implements IPalikasDatasource {
  async getProvinces(): Promise<Province[]> {
    await this.delay(50)
    return getFakeProvinces()
  }

  async getDistricts(provinceId?: number): Promise<District[]> {
    await this.delay(50)
    return getFakeDistricts(provinceId)
  }

  async getPalikas(districtId?: number): Promise<Palika[]> {
    await this.delay(50)
    return getFakePalikas(districtId)
  }

  async getPalikaById(id: number): Promise<Palika | null> {
    await this.delay(50)
    const palikas = getFakePalikas()
    const palika = palikas.find(p => p.id === id)
    return palika || null
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
