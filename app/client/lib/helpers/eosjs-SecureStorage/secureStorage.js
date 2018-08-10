import _storage from './storage'
import {
  extend
} from './utils'
import {AES} from 'aes-oop'

export default class SecureStorage {
  constructor (options) {
    const config = {
      id: 'SECURE_STORAGE',
      expires: null
    }
    this.options = extend({}, config, options)
    this.storage = options.storage || _storage
    this._init()
  }

  _init () {
    // 初始化缓存操作
  }

  set (key, value, psw, exp) {
    let encryptedData = AES.encrypt(value, psw)
    let item = this._setVal(key, encryptedData, exp)
    key = this._setKey(key)
    this.storage.set(key, item)
    return this
  }

  get (key, psw) {
    key = this._setKey(key)
    let item = this.storage.get(key)
    let value = AES.decrypt(this._getVal(item), psw)
    return value
  }

  remove (key) {
    key = this._setKey(key)
    this.storage.remove(key)
    return this
  }

  forEach (callback) {
    this.storage.each((item, key) => {
      key = this._getKey(key)
      if (!key) return
      const value = this._getVal(item)
      if (value !== undefined && value !== null) callback(value, key)
    })
  }

  clear () {
    this.forEach((value, key) => {
      this.remove(key)
    })
    return this
  }

  has (key) {
    return !!this.get(key)
  }

  getAll () {
    let allMap = {}
    this.forEach((value, key) => {
      allMap[key] = value
    })
    return allMap
  }

  _setVal (key, value, exp) {
    return {
      value: value,
      key: key,
      exp: exp === undefined || exp === null ? this.options.expires : exp,
      time: new Date().getTime()
    }
  }

  _getVal (item) {
    if (item === null) return null
    let nowTime = new Date().getTime()
    if (item.exp !== undefined && item.exp !== null && nowTime - item.time >= item.exp) {
      this.storage.remove(item.key)
      return null
    }
    return item.value
  }

  _setKey (key) {
    return this.options.id + '_' + key
  }

  _getKey (key) {
    if (key.indexOf(this.options.id + '_') !== 0) return
    return key.substring(this.options.id.length + 1)
  }
}