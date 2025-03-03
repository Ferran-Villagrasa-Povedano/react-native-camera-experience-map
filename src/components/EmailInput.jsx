import Close from "@assets/Close";
import { useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EmailInput({ emails, onEmailsChange }) {
  const [currentEmail, setCurrentEmail] = useState("");
  const inputRef = useRef(null);

  const addEmail = () => {
    const trimmedEmail = currentEmail.trim();
    if (trimmedEmail && !emails.includes(trimmedEmail)) {
      onEmailsChange([...emails, trimmedEmail]);
      setCurrentEmail("");
    }
  };

  const removeEmail = (email) => {
    onEmailsChange(emails.filter((e) => e !== email));
  };

  const removeLastEmail = () => {
    onEmailsChange(emails.slice(0, -1));
  };

  return (
    <View className="border border-gray-300 rounded-md pl-3 mb-4 flex-wrap flex-row">
      {emails.map((email) => (
        <View
          key={email}
          className="flex-row items-center bg-blue-100 rounded-full px-3 py-1 my-2 mr-2 "
        >
          <TouchableOpacity onPress={() => removeEmail(email)}>
            <Close fill="#ef4444" width={20} height={20} />
          </TouchableOpacity>
          <Text className="ml-2 text-blue-700">{email}</Text>
        </View>
      ))}

      <TextInput
        ref={inputRef}
        value={currentEmail}
        onChangeText={setCurrentEmail}
        placeholder={emails.length ? "" : "Enter the emails..."}
        className="flex-1"
        onSubmitEditing={(e) => {
          e.preventDefault();
          addEmail();
        }}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Backspace" && currentEmail === "") {
            removeLastEmail();
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        submitBehavior="submit"
      />
    </View>
  );
}
