import { View, Text, StyleSheet, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/colors";
import { listingDialogueQuery, chatWithSeller } from "@/api/market";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/dialog/Dialog";
import { NegotiateAction } from "@/components/dialog/NegotiateAction";
import { useEffect, useState } from "react";
import { IDialogMessage, DialogSpeakerType } from "@/types/dialog";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";

const initMessage:IDialogMessage = {
  id: "1",
  speaker: "player",
  text: "Привет, продаешь?"
}


export default function MarketInspectionScreen() {
  const [messages, setMessages] = useState<IDialogMessage[]>([initMessage]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const {data: initialDialogue} = useQuery(listingDialogueQuery(id));

  const chatMutation = useMutation({
    mutationFn: () => chatWithSeller(id),
    onSuccess: (data) => {
      addMessage(data.dialogue, "npc");
    },
  });

  useEffect(() => {
    if (!initialDialogue) return;
    
    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: crypto.randomUUID(),
        speaker: "npc",
        text: initialDialogue?.dialogue || '',
      },
    ]);
  }, [initialDialogue]);

  function addMessage(text: string, type: DialogSpeakerType) {
    setMessages((previousMessages) => [
      ...previousMessages,
      {
        id: crypto.randomUUID(),
        speaker: type,
        text: text,
      },
    ]);
  }

  function onBuy() {
    addMessage('По рукам! Поехали оформляться.', 'player');

  }

  function onNegotiate() {
    //modal with price selector
    const proposedPrice = 12;
    addMessage(`Предложение хорошее, но цена велика. Как насчет ${proposedPrice}?`, 'player');
  }

  function onChat() {
    addMessage('Что с машиной? Только честно!', 'player');
    chatMutation.mutate();
  }

  function onQuit() {
    addMessage('До встречи!', 'player');
    setTimeout(() => {
      router.replace({
        pathname: "/market"
      });
    }, 1000);
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("@/../assets/images/backgrounds/background_market.png")}
        style={styles.marketImg}
        resizeMode="cover"
      />
      <View style={styles.absolutContainer}>
        <View style={styles.title}>
          <Text style={styles.titleText}>ОСМОТР АВТОМОБИЛЯ</Text>
        </View>
        <View style={styles.dialogContainer}>
          <View style={styles.sellerContainer}></View>
          <Dialog messages={messages}/>
        </View>

        <View style={styles.actionsContainer}>
          <NegotiateAction text={'КУПИТЬ\n(1200)'} onPress={onBuy} iconName='shopping-cart' iconColor='#84d78c' color='#429958'/>
          <NegotiateAction text={'ТОРГ'} onPress={onNegotiate} iconName='handshake' iconColor='#be6b22' color='#EBA13C'/>
          <NegotiateAction text={'СПРОСИТЬ\nО КАСЯКАХ'} onPress={onChat} iconName='bug' iconColor='#09427a' color='#307DC1'/>
          <NegotiateAction text='УЙТИ' onPress={onQuit} iconName='door-open' iconColor='#821f14' color='#C5453C'/>
        </View>
        
        
      </View>
      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
    position: 'relative'
  },

  marketImg: {
    width: "100%",
    height: "35%",
  },

  absolutContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center'
  },

  title: {
    width: '100%',
    backgroundColor: colors.darkBackground,
    opacity: 0.93,
    height: 50,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },

  titleText: {
    color: colors.textMain,
    fontSize: 18,
    fontWeight: 'bold'
  },

  dialogContainer: {
    backgroundColor: 'rgba(34, 55, 44, 0.6)',
    width: '90%',
    height: '74%',
    borderRadius: 8,
    borderColor: colors.lightBackground,
    borderWidth: 3,
    boxShadow: '0px 0px 15px 3px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    overflow: 'hidden'
  },

  sellerContainer: {
    height: '24%',
    width: '100%',
  },

  actionsContainer: {
    marginTop: 12,
    paddingBottom: 12,
    flex: 1,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});