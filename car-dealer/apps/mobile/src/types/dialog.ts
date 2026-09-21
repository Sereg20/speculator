export type DialogSpeakerType = "player" | "npc";

export interface IDialogMessage {
  id: string;
  text: string;
  speaker: DialogSpeakerType;
}