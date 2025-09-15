import { CircleDeck } from "@/components/deck-shuffle/CircleDeck";
import { SelectCardCount } from "@/components/deck-shuffle/SelectCardCount";
import { ShuffleCards } from "@/components/deck-shuffle/ShuffleCards";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/header/Header";
import { spreads } from "../spreads/spreadList";

let selectedSpread: {
  id: number;
  title: string;
  cards: string;
  description: string;
};

const ShuffleCard = () => {
  const { id } = useLocalSearchParams();

  const [isTitleShow, setIsTitleShow] = useState(true);

  //states for card count selectiong
  const [howManyCardCount, setHowManyCardCount] = useState([]);
  const [howManyCountSelected, setHowManyCountSelected] = useState(0);

  //states for shuffling deck
  const [isShuffling, setIsShuffling] = useState(false);

  //states for circleDeck
  const [isCircleDeck, setIsCircleDeck] = useState(false);

  useEffect(() => {
    selectedSpread = spreads.find((s) => s.id === Number(id));

    if (selectedSpread?.cards.includes("–")) {
      const [min, max] = selectedSpread.cards.split("–").map(Number);
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      setHowManyCardCount(range);
    } else {
      setHowManyCountSelected(
        selectedSpread?.cards ? Number(selectedSpread.cards) : 0
      );
      setIsShuffling(true);
    }
  }, [id]);

  const selectCardCountHandler = (item) => {
    setHowManyCountSelected(item);
    setHowManyCardCount([]);
    setIsTitleShow(false);
    setIsShuffling(true);
    setTimeout(() => {
      console.log("howManyCountSelected:", item);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        showBackButton={true}
        showLogo={false}
        title="Shuffle"
        showDeckAssetDrawer={false}
        showSettings={false}
      />
      <View style={styles.middleWrapper}>
        {isTitleShow && (
          <Text style={styles.title}>{selectedSpread?.title}</Text>
        )}

        {/* for card count selection */}
        {howManyCardCount.length > 0 && (
          <SelectCardCount
            howManyCardCount={howManyCardCount}
            howManyCountSelected={howManyCountSelected}
            selectCardCountHandler={selectCardCountHandler}
          />
        )}

        {/* for shuffling the deck */}
        {isShuffling && (
          <ShuffleCards
            setIsShuffling={setIsShuffling}
            setIsCircleDeck={setIsCircleDeck}
            setIsTitleShow={setIsTitleShow}
          />
        )}

        {/*for circling the deck nad chooose cards */}
        {isCircleDeck && (
          <CircleDeck
            howManyCountSelected={howManyCountSelected}
            setIsTitleShow={setIsTitleShow}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

//ilk önce eğer kart seçimi varsa ekrana yazı gelicek ve kaç tane kart seçiceği sorulucak
//aşağıda kart çıkıcak ortada yazı çıkıcak shuffle diye ve ekrana tıklayına kartlar dağılıcak parmak ile kaydırıp karıştırabilirin ve aşağıda done butonu çıkıcak
//done tıklandığında  kartlar aşağıda toplanıcak sonra çembere dağılıcak ve döndürme efekti çıkıcak
//karta tıklandığında kart pozisyonunu değiştirirerek yerien gidicek onun yerine başka kart eklenicek

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101010" },
  middleWrapper: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    color: "#fff",
  },
});

export default ShuffleCard;
