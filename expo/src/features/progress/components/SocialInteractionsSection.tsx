import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

type IncomingFriendRequest = {
  id: string;
  sender_id: string;
  sender_username?: string;
};

type Props = {
  incomingFriendRequests: IncomingFriendRequest[];
  colors: {
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
  };
  labels: {
    friendRequests: string;
    accept: string;
    decline: string;
  };
  onAccept: (requestId: string, senderId: string) => void;
  onReject: (requestId: string) => void;
};

export function SocialInteractionsSection({ incomingFriendRequests, colors, labels, onAccept, onReject }: Props) {
  if (incomingFriendRequests.length === 0) {
    return null;
  }

  return (
    <View style={styles.friendRequestsWrap}>
      <Text style={[styles.friendRequestsTitle, { color: colors.text }]}>{labels.friendRequests}</Text>
      {incomingFriendRequests.map((request) => (
        <View key={request.id} style={[styles.friendRequestRow, { borderColor: colors.border }]}> 
          <Text style={[styles.friendRequestName, { color: colors.text }]}>{request.sender_username ?? request.sender_id}</Text>
          <View style={styles.friendRequestActions}>
            <TouchableOpacity
              onPress={() => onAccept(request.id, request.sender_id)}
              style={[styles.friendRequestButton, { backgroundColor: colors.success + '22' }]}
            >
              <Text style={[styles.friendRequestButtonText, { color: colors.success }]}>{labels.accept}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReject(request.id)}
              style={[styles.friendRequestButton, { backgroundColor: colors.error + '22' }]}
            >
              <Text style={[styles.friendRequestButtonText, { color: colors.error }]}>{labels.decline}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
