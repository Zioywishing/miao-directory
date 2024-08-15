import generateId from "./generateId.js"

// 一个文件操作事件
class FsOprateEvent {
    constructor(event){
        this.status = 'progress'
        this.uid = generateId()
        event.then(()=>{
            this.status = 'success'
        }).catch((e)=>{
            this.failedEvent = e
            this.status = 'failed'
        })
    }
    /**
     * 事件状态，分为progress, success, failed
     */
    failedEvent
    status
    uid
}

class FsOprateEventCenter {
    constructor(){
        this.eventMap = {}
    }
    eventMap
    /**
     * 推送一个事件，返回这个事件的id，后续可以通过这个id查询这个事件的状态
     * @param {Promise} event
     * @returns {number} 事件id
     */
    push(event){
        const ev = new FsOprateEvent(event)
        const id = ev.uid
        this.eventMap[id] = {
            event: ev,
            // 每小时自查询一下状态，防止一直没查询导致内存泄漏
            timer: setInterval(()=>{
                this.query(id)
            }, 1000*60*60)
        }
        return id
    }
    /**
     * 推送一个事件，返回这个事件的id，后续可以通过这个id查询这个事件的状态
     * 当查询到这个事件已经完成的时候，将这个事件移除出事件表(eventMap)
     * @param {number} id 事件id
     * @returns {{status: 'success' | 'failed' | 'progress' | 'unknow'; result?: any}} 事件id
     */
    query(id){
        let status
        if(!this.eventMap[id]){
            status = 'unknow'
        }
        else{
            status = this.eventMap[id].event.status
        }
        const res = {status}
        if( ['success', 'failed'].includes(status) ){
            if(status === 'failed'){
                res.failedEvent = this.eventMap[id].event.failedEvent
            }
            clearInterval(this.eventMap[id].timer)
            this.eventMap[id] = undefined
        }
        return res
    }
}

const fsOprateEventCenter = new FsOprateEventCenter()

/**
 * 除了上传以外的所有文件操作都统一通过这个进行管理
 * @returns {fsOprateEventCenter}
 */
export default function useFsOprateEventCenter(){
    return fsOprateEventCenter
}
