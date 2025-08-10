import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  showBackButton?: boolean;
  showLogo?: boolean;
  title?: string;
  showDeckAssetDrawer?: boolean;
  showSettings?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  showBackButton = false,
  showLogo = true,
  title = "",
  showDeckAssetDrawer = true,
  showSettings = true,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBackButton ? (
          <TouchableOpacity onPress={() => router.back()}>
            {/* Geri butonu ikonu */}
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>
        ) : showLogo ? (
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
        ) : null}
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.right}>
        {showDeckAssetDrawer && (
          <TouchableOpacity onPress={() => router.push("/deck-asset-drawer")}>
            {/* Deck asset drawer ikonu */}
            <Text style={styles.icon}>🃏</Text>
          </TouchableOpacity>
        )}
        {showSettings && (
          <TouchableOpacity onPress={() => router.push("/settings")}>
            {/* Settings ikonu */}
            <Text style={styles.icon}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 16,
    // backgroundColor: "rgba(255,255,255,0.2)", // transparan
    // borderBottomWidth: 1, // kaldırıldı
    // borderBottomColor: '#eee', // kaldırıldı
    // backdropFilter: 'blur(10px)', // web için, native için BlurView kullanılabilir
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  center: {
    flex: 2,
    alignItems: "center",
  },
  right: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  icon: {
    fontSize: 24,
    marginLeft: 16,
    color: "white",
  },
});

export default Header;
