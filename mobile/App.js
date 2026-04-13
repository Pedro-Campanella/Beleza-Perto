import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";

import { apiRequest } from "./src/api";
import { availableServices } from "./src/constants";

const emptyRegisterForm = {
  role: "client",
  name: "",
  email: "",
  password: "",
  phone: "",
  city: "",
  address: "",
  latitude: "",
  longitude: "",
  services: [],
  bio: "",
};

const emptyLoginForm = {
  email: "",
  password: "",
};

const initialFilters = {
  service: "",
  minRating: "",
  latitude: "",
  longitude: "",
  maxDistanceKm: "",
  sortBy: "relevance",
};

function roleLabel(role) {
  if (role === "professional") return "Profissional";
  if (role === "salon") return "Salão";
  return "Cliente";
}

function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return "N/A";
  return `${distanceKm.toFixed(1)} km`;
}

export default function App() {
  const [mode, setMode] = useState("login");
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [token, setToken] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    bio: "",
    services: [],
  });

  const isAuthenticated = Boolean(token && currentUser);
  const isProvider = currentUser?.role === "professional" || currentUser?.role === "salon";

  const selectedServicesText = useMemo(
    () => (registerForm.services.length ? registerForm.services.join(", ") : "Nenhum selecionado"),
    [registerForm.services],
  );

  const selectedProfileServicesText = useMemo(
    () => (profileForm.services.length ? profileForm.services.join(", ") : "Nenhum selecionado"),
    [profileForm.services],
  );

  function toggleService(target, service) {
    if (target.includes(service)) {
      return target.filter((item) => item !== service);
    }
    return [...target, service];
  }

  function handleRegisterField(field, value) {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleLoginField(field, value) {
    setLoginForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleProfileField(field, value) {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function setUserData(data) {
    setCurrentUser(data);
    setProfileForm({
      name: data.name || "",
      phone: data.phone || "",
      city: data.location?.city || "",
      address: data.location?.address || "",
      latitude:
        typeof data.location?.lat === "number" && !Number.isNaN(data.location.lat)
          ? String(data.location.lat)
          : "",
      longitude:
        typeof data.location?.lng === "number" && !Number.isNaN(data.location.lng)
          ? String(data.location.lng)
          : "",
      bio: data.bio || "",
      services: Array.isArray(data.services) ? data.services : [],
    });
  }

  async function submitRegister() {
    setLoading(true);
    try {
      const payload = {
        ...registerForm,
        latitude: Number(registerForm.latitude),
        longitude: Number(registerForm.longitude),
      };

      if (registerForm.role === "client") {
        delete payload.services;
        delete payload.bio;
      }

      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: payload,
      });

      setToken(response.token);
      setUserData(response.user);
      setRegisterForm(emptyRegisterForm);
      setMode("search");
      Alert.alert("Sucesso", "Cadastro concluído e login realizado.");
    } catch (error) {
      Alert.alert("Erro no cadastro", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitLogin() {
    setLoading(true);
    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: loginForm,
      });

      setToken(response.token);
      setUserData(response.user);
      setMode("search");
      Alert.alert("Bem-vinda(o)", `Login realizado com sucesso.`);
    } catch (error) {
      Alert.alert("Erro no login", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const response = await apiRequest("/users/me", {
        token,
      });
      setUserData(response.user);
      setMode("profile");
    } catch (error) {
      Alert.alert("Erro ao carregar perfil", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setLoading(true);
    try {
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        city: profileForm.city,
        address: profileForm.address,
        bio: profileForm.bio,
      };

      const hasLat = profileForm.latitude.trim() !== "";
      const hasLng = profileForm.longitude.trim() !== "";

      if (hasLat || hasLng) {
        payload.lat = Number(profileForm.latitude);
        payload.lng = Number(profileForm.longitude);
      }

      if (isProvider) {
        payload.services = profileForm.services;
      }

      const response = await apiRequest("/users/me", {
        method: "PUT",
        token,
        body: payload,
      });

      setUserData(response.user);
      Alert.alert("Perfil atualizado", "Seus dados foram atualizados.");
    } catch (error) {
      Alert.alert("Erro ao atualizar perfil", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSearch() {
    setSearchLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.service.trim()) query.append("service", filters.service.trim());
      if (filters.minRating.trim()) query.append("minRating", filters.minRating.trim());
      if (filters.latitude.trim()) query.append("lat", filters.latitude.trim());
      if (filters.longitude.trim()) query.append("lng", filters.longitude.trim());
      if (filters.maxDistanceKm.trim()) query.append("maxDistanceKm", filters.maxDistanceKm.trim());
      if (filters.sortBy) query.append("sortBy", filters.sortBy);

      const endpoint = query.toString() ? `/providers?${query.toString()}` : "/providers";
      const response = await apiRequest(endpoint);
      setProviders(response.providers || []);
      setMode("search");
    } catch (error) {
      Alert.alert("Erro na busca", error.message);
    } finally {
      setSearchLoading(false);
    }
  }

  function logout() {
    setToken("");
    setCurrentUser(null);
    setProviders([]);
    setMode("login");
    setLoginForm(emptyLoginForm);
    setProfileForm({
      name: "",
      phone: "",
      city: "",
      address: "",
      latitude: "",
      longitude: "",
      bio: "",
      services: [],
    });
  }

  function renderRoleSwitch() {
    const providerSelected = registerForm.role !== "client";

    return (
      <View style={styles.switchRow}>
        <Text style={styles.label}>Quero me cadastrar como profissional/salão</Text>
        <Switch
          value={providerSelected}
          onValueChange={(value) =>
            handleRegisterField("role", value ? "professional" : "client")
          }
        />
      </View>
    );
  }

  function renderServicesSelector(services, onToggle) {
    return (
      <View style={styles.servicesWrap}>
        {availableServices.map((service) => {
          const selected = services.includes(service);
          return (
            <Pressable
              key={service}
              style={[styles.tag, selected && styles.tagSelected]}
              onPress={() => onToggle(service)}
            >
              <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{service}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  function renderAuth() {
    const showProviderFields = registerForm.role !== "client";

    return (
      <View style={styles.card}>
        <Text style={styles.title}>Beleza Perto</Text>
        <Text style={styles.subtitle}>
          Conecte clientes a profissionais e salões para serviços de beleza.
        </Text>

        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, mode === "login" && styles.modeButtonActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.modeButtonText, mode === "login" && styles.modeButtonTextActive]}>
              Entrar
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === "register" && styles.modeButtonActive]}
            onPress={() => setMode("register")}
          >
            <Text
              style={[styles.modeButtonText, mode === "register" && styles.modeButtonTextActive]}
            >
              Cadastrar
            </Text>
          </Pressable>
        </View>

        {mode === "login" ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginForm.email}
              onChangeText={(value) => handleLoginField("email", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              secureTextEntry
              value={loginForm.password}
              onChangeText={(value) => handleLoginField("password", value)}
            />
            <Pressable style={styles.primaryButton} onPress={submitLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Entrar</Text>}
            </Pressable>
          </>
        ) : (
          <>
            {renderRoleSwitch()}
            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={registerForm.name}
              onChangeText={(value) => handleRegisterField("name", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={registerForm.email}
              onChangeText={(value) => handleRegisterField("email", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha (mínimo 6 caracteres)"
              secureTextEntry
              value={registerForm.password}
              onChangeText={(value) => handleRegisterField("password", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefone"
              value={registerForm.phone}
              onChangeText={(value) => handleRegisterField("phone", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Cidade"
              value={registerForm.city}
              onChangeText={(value) => handleRegisterField("city", value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Endereço"
              value={registerForm.address}
              onChangeText={(value) => handleRegisterField("address", value)}
            />
            <View style={styles.twoCols}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Latitude"
                keyboardType="numeric"
                value={registerForm.latitude}
                onChangeText={(value) => handleRegisterField("latitude", value)}
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                placeholder="Longitude"
                keyboardType="numeric"
                value={registerForm.longitude}
                onChangeText={(value) => handleRegisterField("longitude", value)}
              />
            </View>

            {showProviderFields && (
              <>
                <Text style={styles.label}>Serviços oferecidos</Text>
                {renderServicesSelector(registerForm.services, (service) =>
                  handleRegisterField("services", toggleService(registerForm.services, service)),
                )}
                <Text style={styles.helper}>{selectedServicesText}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Descrição do profissional/salão"
                  multiline
                  numberOfLines={4}
                  value={registerForm.bio}
                  onChangeText={(value) => handleRegisterField("bio", value)}
                />
              </>
            )}

            <Pressable style={styles.primaryButton} onPress={submitRegister} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Criar conta</Text>
              )}
            </Pressable>
          </>
        )}
      </View>
    );
  }

  function renderSearch() {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Buscar profissionais</Text>
        <Text style={styles.subtitle}>
          Filtre por serviço, avaliação e proximidade para encontrar o melhor atendimento.
        </Text>

        <Text style={styles.userInfo}>
          Logada(o) como: {currentUser?.name} ({roleLabel(currentUser?.role)})
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Serviço (ex: unha, cabelos)"
          value={filters.service}
          onChangeText={(value) => setFilters((prev) => ({ ...prev, service: value }))}
        />
        <View style={styles.twoCols}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Avaliação mínima (0-5)"
            keyboardType="numeric"
            value={filters.minRating}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, minRating: value }))}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Distância máxima (km)"
            keyboardType="numeric"
            value={filters.maxDistanceKm}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, maxDistanceKm: value }))}
          />
        </View>
        <View style={styles.twoCols}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Latitude"
            keyboardType="numeric"
            value={filters.latitude}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, latitude: value }))}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Longitude"
            keyboardType="numeric"
            value={filters.longitude}
            onChangeText={(value) => setFilters((prev) => ({ ...prev, longitude: value }))}
          />
        </View>

        <Text style={styles.label}>Ordenação</Text>
        <View style={styles.servicesWrap}>
          {["relevance", "rating", "distance"].map((item) => {
            const selected = filters.sortBy === item;
            return (
              <Pressable
                key={item}
                style={[styles.tag, selected && styles.tagSelected]}
                onPress={() => setFilters((prev) => ({ ...prev, sortBy: item }))}
              >
                <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButtonSmall} onPress={runSearch} disabled={searchLoading}>
            {searchLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Pesquisar</Text>
            )}
          </Pressable>
          <Pressable style={styles.secondaryButtonSmall} onPress={loadProfile} disabled={loading}>
            <Text style={styles.secondaryText}>Meu perfil</Text>
          </Pressable>
          <Pressable style={styles.secondaryButtonSmall} onPress={logout}>
            <Text style={styles.secondaryText}>Sair</Text>
          </Pressable>
        </View>

        <Text style={styles.resultsTitle}>Resultados ({providers.length})</Text>
        {providers.map((provider) => (
          <View key={provider.id} style={styles.resultCard}>
            <Text style={styles.resultName}>
              {provider.name} · {roleLabel(provider.role)}
            </Text>
            <Text style={styles.resultText}>
              Serviços: {provider.services?.length ? provider.services.join(", ") : "não informado"}
            </Text>
            <Text style={styles.resultText}>Avaliação: {provider.rating ?? "N/A"}</Text>
            <Text style={styles.resultText}>
              Distância: {formatDistance(provider.distanceKm)} · Cidade: {provider.location?.city || "N/A"}
            </Text>
            <Text style={styles.resultText}>Contato: {provider.phone || "N/A"} · {provider.email}</Text>
            <Text style={styles.resultText}>Descrição: {provider.bio || "Sem descrição"}</Text>
          </View>
        ))}
      </View>
    );
  }

  function renderProfile() {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Meu perfil</Text>
        <Text style={styles.subtitle}>Atualize seus dados públicos e localização.</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={profileForm.name}
          onChangeText={(value) => handleProfileField("name", value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          value={profileForm.phone}
          onChangeText={(value) => handleProfileField("phone", value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Cidade"
          value={profileForm.city}
          onChangeText={(value) => handleProfileField("city", value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Endereço"
          value={profileForm.address}
          onChangeText={(value) => handleProfileField("address", value)}
        />
        <View style={styles.twoCols}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Latitude"
            keyboardType="numeric"
            value={profileForm.latitude}
            onChangeText={(value) => handleProfileField("latitude", value)}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Longitude"
            keyboardType="numeric"
            value={profileForm.longitude}
            onChangeText={(value) => handleProfileField("longitude", value)}
          />
        </View>

        {isProvider && (
          <>
            <Text style={styles.label}>Serviços oferecidos</Text>
            {renderServicesSelector(profileForm.services, (service) =>
              handleProfileField("services", toggleService(profileForm.services, service)),
            )}
            <Text style={styles.helper}>{selectedProfileServicesText}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição"
              multiline
              numberOfLines={4}
              value={profileForm.bio}
              onChangeText={(value) => handleProfileField("bio", value)}
            />
          </>
        )}

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButtonSmall} onPress={saveProfile} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Salvar</Text>}
          </Pressable>
          <Pressable style={styles.secondaryButtonSmall} onPress={() => setMode("search")}>
            <Text style={styles.secondaryText}>Voltar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {!isAuthenticated ? renderAuth() : mode === "profile" ? renderProfile() : renderSearch()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f1ff",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3a0f75",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#5f5f7a",
    marginBottom: 16,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfb5ff",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#6f2dff",
    borderColor: "#6f2dff",
  },
  modeButtonText: {
    color: "#5f32bf",
    fontWeight: "600",
  },
  modeButtonTextActive: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7d7e4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  inputHalf: {
    flex: 1,
  },
  twoCols: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontWeight: "600",
    color: "#282846",
    marginBottom: 8,
    marginTop: 4,
  },
  helper: {
    fontSize: 12,
    color: "#6d6d8a",
    marginBottom: 8,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#6f2dff",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonSmall: {
    flex: 1,
    backgroundColor: "#6f2dff",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryButtonSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cfb5ff",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: {
    color: "#4f2fa2",
    fontWeight: "600",
  },
  servicesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    borderWidth: 1,
    borderColor: "#cfb5ff",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagSelected: {
    backgroundColor: "#6f2dff",
    borderColor: "#6f2dff",
  },
  tagText: {
    color: "#5f32bf",
    fontWeight: "500",
    fontSize: 12,
    textTransform: "capitalize",
  },
  tagTextSelected: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
    color: "#4d4d6d",
    fontWeight: "500",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 10,
  },
  resultsTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontWeight: "700",
    color: "#2c2c44",
  },
  resultCard: {
    borderWidth: 1,
    borderColor: "#ece7ff",
    backgroundColor: "#faf8ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  resultName: {
    fontWeight: "700",
    color: "#3a0f75",
    marginBottom: 4,
  },
  resultText: {
    color: "#4a4a67",
    fontSize: 13,
    marginBottom: 2,
  },
});
