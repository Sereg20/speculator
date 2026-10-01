import { listingInquiriesQuery, listingQuery, respondToInquiry, RespondToInquiryPayload } from "@/api/listings";
import { updatePlayerState } from "@/api/playerState";
import { useGame } from "@/app/context/GameContext";
import { Dialog } from "@/components/dialog/Dialog";
import { NegotiateAction } from "@/components/dialog/NegotiateAction";
import { NegotiatePriceSelectorDialog } from "@/components/dialog/NegotiatePriceSelectorDialog";
import { colors } from "@/theme/colors";
import { DialogSpeakerType, IDialogMessage } from "@/types/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function ListingInquiryScreen() {
  const { showError } = useGame();
  const { listingId, inquiryId } = useLocalSearchParams<{
    listingId: string;
    inquiryId: string;
  }>();
  const queryClient = useQueryClient();


  const { data: listing, isLoading: isListingLoading } = useQuery(listingQuery(listingId));
  const { data: inquiries = [], isLoading: isInquiriesLoading } = useQuery(listingInquiriesQuery(listingId));

  const inquiry = inquiries.find(
    (item) => item.id === inquiryId
  );

  const initMessage: IDialogMessage = {
    id: "1",
    speaker: "npc",
    text: inquiry?.message_text || ''
  }
  const [messages, setMessages] = useState<IDialogMessage[]>([initMessage]);
  const [negotiateDisabled, setNegotiateDisabled] = useState<boolean>(inquiry?.is_direct_buy || false);
  const [sellDisabled, setSellDisabled] = useState<boolean>(false);
  const [quitDisabled, setQuitDisabled] = useState<boolean>(false);
  const [rejectDisabled, setRejectDisabled] = useState<boolean>(false);
  const [isPriceModalVisible, setPriceModalVisible] = useState<boolean>(false);

  const respondToInquiryMutation = useMutation({
    mutationFn: ({
      listingId,
      inquiryId,
      payload,
    }: {
      listingId: string;
      inquiryId: string;
      payload: RespondToInquiryPayload;
    }) =>
      respondToInquiry(listingId, inquiryId, payload),

    onSuccess: (result) => {
      updatePlayerState(queryClient, result.meta.playerState);
      addMessage(result.data.message, 'npc');

      if (result.data.outcome === 'rejected') {
        
      } else if (result.data.outcome === 'sold') {
        // open success dialog
      } else {
        setNegotiateDisabled(false);
        setSellDisabled(false);
      }

      queryClient.invalidateQueries({
        queryKey: ["listings", listingId, "inquiries"],
      });

      queryClient.invalidateQueries({
        queryKey: ["listings", listingId],
      });
    },

    onError: (error) => {
      showError(error.message);
    },
  });

  if (isListingLoading || isInquiriesLoading) {
    return <Text>Loading...</Text>;
  }

  // ----------------------------------------------
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

  function onNegotiate() {
    setPriceModalVisible(true);
  }

  function onConfirmProposedPrice(proposedPrice: number) {
    setNegotiateDisabled(true);
    setSellDisabled(true);
    respondToInquiryMutation.mutate({
      listingId,
      inquiryId,
      payload: {
        action: "counter",
        counterPrice: proposedPrice,
      },
    });
    setPriceModalVisible(false);
    addMessage(`Слишком низкая цена. Как насчет ${proposedPrice}?`, 'player');
  }

  function onSell() {

  }

  function onReject() {
    setQuitDisabled(true);
    setRejectDisabled(true);
    addMessage('Не сойдемся. Всего хорошего.', 'player');

    respondToInquiryMutation.mutate({
      listingId,
      inquiryId,
      payload: {
        action: "reject"
      },
    });
  }

  function onQuit() {
    router.replace({
      pathname: "/"
    });
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
          <Text style={styles.titleText}>ПРОДАЖА: {listing?.make} {listing?.model}</Text>
        </View>

        <View style={styles.dialogContainer}>
          <View style={styles.sellerContainer}>
            {/* <Image
                source={npcAvatar}
                style={styles.npcAvatar}
              /> */}
            <View style={styles.sellerTitleContainer}>
              <Text style={styles.sellerTitle}>{inquiry?.buyer_name} (покупатель)</Text>
            </View>

          </View>
          <Dialog messages={messages} />
        </View>

        <View style={styles.globalActionsContainer}>
          <View style={styles.actionsContainer}>
            <NegotiateAction disabled={sellDisabled} text={`ПРОДАТЬ\n(${inquiry?.offered_price})`} onPress={onSell} energyCost={2} color='#429958' />
            <NegotiateAction disabled={negotiateDisabled} text={'ТОРГ'} onPress={onNegotiate} energyCost={2} color="#307DC1" />
            <NegotiateAction disabled={rejectDisabled} text='ОТКАЗ' onPress={onReject} energyCost={2} color={colors.orangeButtonColor} />
            <NegotiateAction disabled={quitDisabled} text='УЙТИ' onPress={onQuit} energyCost={2} color='#C5453C' />
          
          </View>
        </View>

      </View>

      {isPriceModalVisible && <NegotiatePriceSelectorDialog visible={isPriceModalVisible} onClose={() => { setPriceModalVisible(false) }} onConfirm={onConfirmProposedPrice} initialPrice={listing?.asking_price || 0} maxPrice={listing?.asking_price || 0} minPrice={(inquiry?.offered_price || 0) + 1}/>}

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
    flex: 1,
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
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20
  },

  npcAvatar: {
    height: 94,
    width: 94,
    borderRadius: 10,
  },

  sellerTitleContainer: {
    height: 90,
    justifyContent: 'center'
  },

  sellerTitle: {
    color: colors.textMain,
    fontSize: 20,
  },

  globalActionsContainer: {
    marginTop: 12,
    paddingBottom: 12,
    width: '90%',
    gap: 8
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  }
});