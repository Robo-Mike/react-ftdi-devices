import * as types from '../constants/actiontypes.js'
import * as apttypes from '../services/aptconstants.js'
import {getDeviceInfoList,openDevice} from '../services/index.js'
//import {openDevice} from '../services/apt.js'

//module scope variables  - perhaps these should be pushed into state
//TODO need to clear up in disconnect
let requestStatusTimer
let getStatusTimer


//action creator bindings
const createGettingDeviceInfos = ()=> {
  return {type : types.GETTING_DEVICE_INFOS}
}

const createReceivedDeviceInfos = (deviceInfos) => {
  return {
    type: types.RECEIVED_DEVICE_INFOS,
    deviceInfos: deviceInfos
  }
}

const createSelectingDevice = (serialNo)=> {
  return {
    type: types.SELECTING_DEVICE,
    serialNo: serialNo
  }
}

const createDeviceConnected = (device, ftdiHandle)=> {
  return {
    type: types.DEVICE_CONNECTED,
    device: device,
    ftdiHandle : ftdiHandle
  }
}

const createReceivedDeviceStatus = (currentPosition)=> {
  return {
    type: types.RECEIVED_DEVICE_STATUS,
    currentPosition : currentPosition
  }
}

const createSetTargetPosition= (targetPosition)=> {
  return {
    type: types.SET_DEVICE_POSITION,
    targetPosition : targetPosition
  }
}

const createSendToDevice= ()=> {
  return {
    type: types.SEND_TO_DEVICE
  }
}


/*BUSINESS LOGIC RELATING TO STATE CHANGES HERE*/


export const refreshDeviceInfoList = () => {
    return dispatch => {
    dispatch(createGettingDeviceInfos())
    getDeviceInfoList()
    .then(deviceInfos => {
      dispatch(createReceivedDeviceInfos(deviceInfos))}, obj => {/*todo getdeviceinfos error*/})
  }
}

export const onTargetPositionChanged = (targetPosition) => {
  return dispatch => {
    dispatch(createSetTargetPosition(targetPosition))

  }
}

export const onSendToDevice = () => {
  return async ( dispatch, getState ) => {
    dispatch(createSendToDevice())
    //TODo send set message but dont wait for response
    const ftdi = getState().deviceReducer.ftdiHandle
    const targetPosition = getState().deviceReducer.device.targetPosition
    const ftStatus = await ftdi.setMoveAbsolutePzMot(targetPosition)
    //console.log('set position status returned' + ftStatus)
  }

}


//TODO services openDevice, getDeviceInfoList
//TOD0 handle errors add new opendeviceerror action type
export const onDeviceInfoListItemClicked = (serialNo) => {
  return dispatch => {
    dispatch(createSelectingDevice(serialNo))
    openDevice(serialNo)
    .then(obj => {dispatch(createDeviceConnected(obj.device, obj.ftdi))
                    onOpenDeviceSuccesfull(obj.ftdi, dispatch)} , obj => {/*todo open device error*/} )
  }
}

const onOpenDeviceSuccesfull = (ftdi, dispatch) => {
    requestStatusTimer = setInterval(() => {ftdi.requestStatusPzMot()},250)
    getStatusTimer = setInterval(()=>{getDeviceStatus(ftdi, dispatch)},250)

}


export const getDeviceStatus = async (ftdi, dispatch) => {
  const messageResult = await ftdi.getMessage()
  //console.log("messageResult type is " + messageResult.messageType )
  if (messageResult.messageType === apttypes.APT_PZMOT_GET_STATUS_UPDATE)
  {
    if (messageResult.data.isUpdate)
    {
        dispatch(createReceivedDeviceStatus(messageResult.data.position))
    }
  }

}
