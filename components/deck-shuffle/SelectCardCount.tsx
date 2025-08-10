import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  howManyCardCount: number[];
  howManyCountSelected: number;
  selectCardCountHandler: (count: number) => void;
};

export const SelectCardCount: React.FC<Props> = ({
  howManyCardCount,
  howManyCountSelected,
  selectCardCountHandler,
}) => {
  return (
    <View style={{ padding: 30 }}>
      <Text style={{ color: "#fff", textAlign: "center", marginBottom: 20 }}>
        How many card would you like to select
      </Text>
      {howManyCardCount.map((item) => (
        <TouchableOpacity
          key={item}
          style={{
            padding: 10,
            backgroundColor: howManyCountSelected === item ? "#fff" : "#444",
            marginVertical: 5,
            borderRadius: 6,
          }}
          onPress={() => selectCardCountHandler(item)}
        >
          <Text
            style={{
              color: howManyCountSelected === item ? "#000" : "#fff",
              textAlign: "center",
            }}
          >
            {item}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
