
import { get, set, del } from 'idb-keyval';

export async function saveAudioFile(id: string, file: Blob): Promise<void> {
  await set(`audio-${id}`, file);
}

export async function getAudioFile(id: string): Promise<Blob | undefined> {
  return await get(`audio-${id}`);
}

export async function deleteAudioFile(id: string): Promise<void> {
  await del(`audio-${id}`);
}
