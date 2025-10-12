import { Box as BoxIcon, FileText, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { type Box } from "@/lib/api";
import { formatDate, isRetentionDateClose } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BoxCardProps {
  box: Box;
  onDelete: (boxId: string) => void;
  onEdit: (box: Box) => void;
}

const BoxCard = ({ box, onDelete, onEdit }: BoxCardProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getBorderColor = (status: string) => {
    switch (status) {
      case 'owned':
        return 'border-green-500';
      case 'restricted':
        return 'border-red-500';
      case 'borrowed':
        return 'border-gray-500';
      default:
        return 'border-primary/50';
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${getBorderColor(box.status)} hover:shadow-xl`}>
      <CardContent className="pt-6" onClick={() => navigate(`/box/${box.id}`)}>
        <div className="flex items-start justify-between mb-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <BoxIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{box.pdfCount} {t('box.pdfs')}</span>
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
          {box.name}
          {box.retentionDate && isRetentionDateClose(box.retentionDate) && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {t('dashboard.expiringSoon')}
            </Badge>
          )}
        </h3>

        <div className="text-sm text-muted-foreground space-y-1">
          <p>{t('box.created')} {formatDate(box.createdAt)}</p>
          {box.retentionDate && (
            <p>{t('box.retention')}: {formatDate(box.retentionDate)}</p>
          )}
          <p>{t('box.status')}: <span className="capitalize">{box.status}</span></p>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(box);
          }}
        >
          <Edit className="h-4 w-4" />
          {t('box.edit')}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              {t('box.delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('box.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('box.deleteWarning', { name: box.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('box.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(box.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('box.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

export default BoxCard;
