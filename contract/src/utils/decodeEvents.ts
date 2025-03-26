import { BytesLike, getBytes, hexlify, toUtf8String, toBigInt, getAddress } from "ethers";
import { decodeString, decodeBytes32, decodeBool, decodeStringArray, decodeAddress, decodeUint256, decodeUint32, decodeBytes } from "./decodeData";
import { decryptBinaryData, decryptUtf8Data } from "./encryption";
import { JobCreatedEvent, JobUpdatedEvent, JobSignedEvent, JobRatedEvent, JobDisputedEvent, JobArbitratedEvent, JobMessageEvent, JobEventType, CustomJobEvent } from "../interfaces";

export const decodeJobCreatedEvent = (rawData: BytesLike): JobCreatedEvent => {
  const bytes = getBytes(rawData);
  let ptr = {bytes, index: 0};

  const result = {} as JobCreatedEvent;
  result.title = decodeString(ptr);
  result.contentHash = decodeBytes32(ptr);
  result.multipleApplicants = decodeBool(ptr);
  result.tags = decodeStringArray(ptr);
  result.token = decodeAddress(ptr);
  result.amount = decodeUint256(ptr);
  result.maxTime = decodeUint32(ptr);
  result.deliveryMethod = decodeString(ptr);
  result.arbitrator = decodeAddress(ptr);
  result.whitelistWorkers = decodeBool(ptr);
  return result;
};

export const decodeJobUpdatedEvent = (rawData: BytesLike): JobUpdatedEvent => {
  const bytes = getBytes(rawData);
  let ptr = {bytes, index: 0};

  const result = {} as JobUpdatedEvent;
  result.title = decodeString(ptr);
  result.contentHash = decodeBytes32(ptr);
  result.tags = decodeStringArray(ptr);
  result.amount = decodeUint256(ptr);
  result.maxTime = decodeUint32(ptr);
  result.arbitrator = decodeAddress(ptr);
  result.whitelistWorkers = decodeBool(ptr);

  return result;
};

export const decodeJobSignedEvent = (rawData: BytesLike): JobSignedEvent => {
  const bytes = getBytes(rawData);
  return {
    revision: new DataView(bytes.buffer, 0).getUint16(0),
    signatire: hexlify(bytes.slice(2)),
  };
}

export const decodeJobRatedEvent = (rawData: BytesLike): JobRatedEvent => {
  const bytes = getBytes(rawData);

  return {
    rating: new DataView(bytes.buffer, 0).getUint8(0),
    review: toUtf8String(bytes.slice(1)),
  };
};

export const decodeJobDisputedEvent = (rawData: BytesLike): JobDisputedEvent => {
  const bytes = getBytes(rawData);
  let ptr = {bytes, index: 0};

  const result = {} as JobDisputedEvent;
  result.encryptedSessionKey = decodeBytes(ptr);
  result.encryptedContent = decodeBytes(ptr);

  return result;
}

export const decryptJobDisputedEvent = (event: JobDisputedEvent, sessionKey: string) => {
  try {
    let decryptionKey;
    try {
      // first try to treat session key as Owner/Worker-Arbitrator session key
      // this is the arbitrator's flow
      event.sessionKey = hexlify(decryptBinaryData(getBytes(event.encryptedSessionKey), sessionKey));
      decryptionKey = event.sessionKey;
    } catch {
      // fall back to Owner/Worker session key
      // this is the owner/worker's flow who are 3rd party to the dispute
      decryptionKey = sessionKey;
      // note: event.sessionKey remains undefined here
    }
    event.content = decryptUtf8Data(getBytes(event.encryptedContent), decryptionKey);
  } catch {
    event.content = "<encrypted message>";
  }
}

export const decodeJobArbitratedEvent = (rawData: BytesLike): JobArbitratedEvent => {
  const bytes = getBytes(rawData);
  const marketplaceData = new DataView(bytes.buffer, 0);
  return {
    creatorShare: marketplaceData.getUint16(0),
    creatorAmount: toBigInt(bytes.slice(2, 34)),
    workerShare: marketplaceData.getUint16(34),
    workerAmount: toBigInt(bytes.slice(36, 68)),
    reasonHash: hexlify(bytes.slice(68, 100)),
    workerAddress: getAddress(hexlify(bytes.slice(100, 120))),
    arbitratorAmount: toBigInt(bytes.slice(120, 152)),
  };
}

export const decodeJobMessageEvent = (rawData: BytesLike): JobMessageEvent => {
  const bytes = getBytes(rawData);

  return {
    contentHash: hexlify(bytes.slice(0, 32)),
    recipientAddress: getAddress(hexlify(bytes.slice(32, 52))),
  };
}

export const decodeCustomJobEvent = (eventType: JobEventType, rawData: BytesLike): CustomJobEvent | undefined => {
  switch (eventType) {
    case JobEventType.Created:
      return decodeJobCreatedEvent(rawData);
    case JobEventType.Updated:
      return decodeJobUpdatedEvent(rawData);
    case JobEventType.Signed:
      return decodeJobSignedEvent(rawData);
    case JobEventType.Rated:
      return decodeJobRatedEvent(rawData);
    case JobEventType.Disputed:
      return decodeJobDisputedEvent(rawData);
    case JobEventType.Arbitrated:
      return decodeJobArbitratedEvent(rawData);
    case JobEventType.WorkerMessage:
    case JobEventType.OwnerMessage:
      return decodeJobMessageEvent(rawData);
    default:
      return undefined;
  }
}
