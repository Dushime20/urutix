import { Edit, Eye, Navigation, Camera, MessageSquare, Star, Phone, Copy, ExternalLink, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";

interface CargoActionsSectionProps {
  isEditing: boolean;
  isTrackingEnabled: boolean;
  showCommentForm: boolean;
  commentText: string;
  onEditToggle: () => void;
  onViewDocuments: () => void;
  onTrackingToggle: () => void;
  onCommentFormToggle: () => void;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: () => void;
  onRatingModalOpen: () => void;
}

const CargoActionsSection = ({
  isEditing,
  isTrackingEnabled,
  showCommentForm,
  commentText,
  onEditToggle,
  onViewDocuments,
  onTrackingToggle,
  onCommentFormToggle,
  onCommentTextChange,
  onCommentSubmit,
  onRatingModalOpen,
}: CargoActionsSectionProps) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="font-medium text-gray-900 mb-6 flex items-center">
        <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full mr-3"></div>
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={onEditToggle}
        >
          <Edit className="w-4 h-4 mr-3 text-blue-600" />
          {isEditing ? "Cancel Edit" : "Edit Cargo"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={onViewDocuments}
        >
          <Eye className="w-4 h-4 mr-3 text-purple-600" />
          View Documents
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={onTrackingToggle}
        >
          <Navigation className="w-4 h-4 mr-3 text-emerald-600" />
          {isTrackingEnabled ? "Stop Tracking" : "Track Shipment"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          <Camera className="w-4 h-4 mr-3 text-orange-600" />
          Photo Documentation
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={onCommentFormToggle}
        >
          <MessageSquare className="w-4 h-4 mr-3 text-indigo-600" />
          Add Comment
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
          onClick={onRatingModalOpen}
        >
          <Star className="w-4 h-4 mr-3 text-yellow-600" />
          Rate Cargo
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          <Phone className="w-4 h-4 mr-3 text-green-600" />
          Contact Owner
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          <Copy className="w-4 h-4 mr-3 text-gray-600" />
          Copy Details
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
        >
          <ExternalLink className="w-4 h-4 mr-3 text-blue-600" />
          Open in New Tab
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-12 justify-start px-4 rounded-lg border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200 col-span-2"
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Delete Cargo
        </Button>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <Label htmlFor="comment" className="text-sm font-medium text-gray-700 mb-2 block">
            Add Comment
          </Label>
          <Textarea
            id="comment"
            placeholder="Enter your comment..."
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            className="mt-2 border-gray-200 focus:border-blue-300 focus:ring-blue-200 resize-none"
            rows={3}
          />
          <div className="flex items-center space-x-3 mt-3">
            <Button
              size="sm"
              onClick={onCommentSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Comment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCommentFormToggle}
              className="px-4 py-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoActionsSection;

