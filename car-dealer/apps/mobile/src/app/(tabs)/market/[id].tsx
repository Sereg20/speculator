import { View, Text, StyleSheet, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { colors } from "@/theme/colors";
import { listingDialogueQuery, chatWithSeller, MarketListing, negotiateListing, purchaseListing, preInspectListing } from "@/api/market";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@/components/dialog/Dialog";
import { NegotiateAction } from "@/components/dialog/NegotiateAction";
import { useEffect, useState } from "react";
import { IDialogMessage, DialogSpeakerType } from "@/types/dialog";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { NegotiatePriceSelectorDialog } from "@/components/dialog/NegotiatePriceSelectorDialog";
import { InspectDialog } from "@/components/dialog/InspectDialog";

const initMessage: IDialogMessage = {
  id: "1",
  speaker: "player",
  text: "Привет, как машинка?"
}


export default function MarketInspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: initialDialogue } = useQuery(listingDialogueQuery(id));
  const queryClient = useQueryClient();

  //get current listing from cache
  const listings =
    queryClient.getQueryData<MarketListing[]>([
      "market",
      "listings",
    ]);
  const listing = listings?.find((item) => item.id === id);

  const [messages, setMessages] = useState<IDialogMessage[]>([initMessage]);
  const [purchaseDisabled, setPurchaseDisabled] = useState<boolean>(false);
  const [chatDisabled, setChatDisabled] = useState<boolean>(false);
  const [preInspectDisabled, setPreInspectDisabled] = useState<boolean>(false);
  const [quitDisabled, setQuitDisabled] = useState<boolean>(false);
  const [negotiateDisabled, setNegotiateDisabled] = useState<boolean>(false);
  const [isPriceModalVisible, setPriceModalVisible] = useState<boolean>(false);
  const [isInspectModalVisible, setInspectModalVisible] = useState<boolean>(false);
  const [currentPrice, setCurrentPrice] = useState<number>(listing?.asking_price || 0);


  // /chat request
  const chatMutation = useMutation({
    mutationFn: () => chatWithSeller(id),
    onSuccess: (data) => {
      addMessage(data.dialogue, "npc");
    },
    onError: (error: ApiError) => {
      if (error instanceof ApiError && error.status === 409) {
        addMessage('Я уже все сказал.', "npc");
        setChatDisabled(true);
      } else {
        addMessage("что-то я завтыкал. Давай-ка еще раз", "npc");
      }
    }
  });

  // /negotiate request
  const negotiateMutation = useMutation({
    mutationFn: (proposedPrice: number) => negotiateListing(id, proposedPrice),

    onSuccess: (data) => {
      if (data.outcome === 'counter' && data.sellerCounterPrice) {
        setCurrentPrice(data.sellerCounterPrice);
        setNegotiateDisabled(false);
      } else if (data.outcome === 'accepted' && data.finalPrice) {
        setCurrentPrice(data.finalPrice);
      } else if (data.outcome === 'rejected') {

      }
      addMessage(data.message, "npc");
    },

    onError: (error) => {
      setNegotiateDisabled(false);
      addMessage("что-то я завтыкал. Давай-ка еще раз", "npc");
    },
  });

  // /purchase request
  const purchaseMutation = useMutation({
    mutationFn: () => purchaseListing(id),
    onSuccess: () => {
      setTimeout(() => {
        router.replace({
          pathname: "/market"
        });
      }, 800);
    },
    onError: (error) => {
      console.log(JSON.stringify(error))
      if (
        error instanceof ApiError &&
        error.status === 400 &&
        error.body.error === "No free garage slot"
      ) {
        addMessage('Совсем забыл! У меня нет свободных мест в гараже', 'player');
      }
    }
  });

  // /preinspect request
  const preInspectMutation = useMutation({
    mutationFn: () => preInspectListing(id, 'visual'),
    onSuccess: () => {
     
    },
    onError: (error) => {
     
    }
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
    setPurchaseDisabled(true);
    addMessage('По рукам! Поехали оформляться.', 'player');
    purchaseMutation.mutate();
  }

  function onNegotiate() {
    setPriceModalVisible(true);
  }

  function onInspect() {
    setInspectModalVisible(true);
  }

  function onQuit() {
    addMessage('До встречи!', 'player');
    setQuitDisabled(true);
    setTimeout(() => {
      router.replace({
        pathname: "/market"
      });
    }, 800);
  }

  function onChat() {
    setInspectModalVisible(false);
    addMessage('Что с машиной? Только честно!', 'player');
    chatMutation.mutate();
  }

  function onPreInspect() {
    setInspectModalVisible(false);
    addMessage('А ну открой капот...', 'player');
    preInspectMutation.mutate();
  }

  function onConfirmProposedPrice(proposedPrice: number) {
    setNegotiateDisabled(true);
    negotiateMutation.mutate(proposedPrice);
    setPriceModalVisible(false);
    addMessage(`Предложение хорошее, но цена велика. Как насчет ${proposedPrice}?`, 'player');
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
          <Text style={styles.titleText}>ОСМОТР АВТОМОБИЛЯ: {listing?.make} {listing?.model}</Text>
        </View>
        <View style={styles.dialogContainer}>
          <View style={styles.sellerContainer}></View>
          <Dialog messages={messages} />
        </View>

        <View style={styles.actionsContainer}>
          <NegotiateAction disabled={purchaseDisabled} text={`КУПИТЬ\n(${currentPrice})`} onPress={onBuy} iconName='shopping-cart' iconColor='#84d78c' color='#429958' />
          <NegotiateAction disabled={negotiateDisabled} text={'ТОРГ'} onPress={onNegotiate} iconName='handshake' iconColor='#be6b22' color='#EBA13C' />
          <NegotiateAction disabled={false} text={'ПРОВЕРИТЬ'} onPress={onInspect} iconName='bug' iconColor='#09427a' color='#307DC1' />
          <NegotiateAction disabled={quitDisabled} text='УЙТИ' onPress={onQuit} iconName='door-open' iconColor='#821f14' color='#C5453C' />
        </View>

      </View>

      <NegotiatePriceSelectorDialog visible={isPriceModalVisible} onClose={() => { setPriceModalVisible(false) }} onConfirm={onConfirmProposedPrice} initialPrice={listing?.asking_price || 0} />
      <InspectDialog visible={isInspectModalVisible} onClose={() => {setInspectModalVisible(false)}} onChat={onChat} onPreInspect={onPreInspect} chatDisabled={chatDisabled} preInspectDisabled={preInspectDisabled}/>
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
    fontSize: 16,
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