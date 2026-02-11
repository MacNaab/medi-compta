import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Phone, Mail, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getLieux, saveLieu, updateLieu, deleteLieu, Lieu } from '@/lib/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export default function Cabinets() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLieu, setEditingLieu] = useState<Lieu | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    pourcentageRetrocession: 80,
    couleur: COLORS[0],
    adresse: '',
    telephone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    setLieux(getLieux());
  }, []);

  const resetForm = () => {
    setFormData({
      nom: '',
      pourcentageRetrocession: 80,
      couleur: COLORS[Math.floor(Math.random() * COLORS.length)],
      adresse: '',
      telephone: '',
      email: '',
      notes: '',
    });
    setEditingLieu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast.error('Le nom du cabinet est requis');
      return;
    }

    if (editingLieu) {
      updateLieu(editingLieu.id, formData);
      toast.success('Cabinet modifié');
    } else {
      saveLieu(formData);
      toast.success('Cabinet ajouté');
    }

    setLieux(getLieux());
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (lieu: Lieu) => {
    setEditingLieu(lieu);
    setFormData({
      nom: lieu.nom,
      pourcentageRetrocession: lieu.pourcentageRetrocession,
      couleur: lieu.couleur,
      adresse: lieu.adresse || '',
      telephone: lieu.telephone || '',
      email: lieu.email || '',
      notes: lieu.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteLieu(id);
    setLieux(getLieux());
    toast.success('Cabinet supprimé');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Cabinets</h1>
          <p className="text-muted-foreground">Gérez vos lieux de remplacement</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau cabinet</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLieu ? 'Modifier le cabinet' : 'Nouveau cabinet'}</DialogTitle>
              <DialogDescription>
                {editingLieu ? 'Modifiez les informations du cabinet' : 'Ajoutez un nouveau lieu de remplacement'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du cabinet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Dr. Martin - Cabinet"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retrocession">Taux de rétrocession (%)</Label>
                <Input
                  id="retrocession"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.pourcentageRetrocession}
                  onChange={(e) => setFormData({ ...formData, pourcentageRetrocession: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, couleur: color })}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        formData.couleur === color ? 'border-foreground scale-110' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="123 Rue de la Santé, 75000 Paris"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@cabinet.fr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Consignes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Codes d'accès, informations importantes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingLieu ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {lieux.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Aucun cabinet</h3>
          <p className="text-muted-foreground mb-6">
            Ajoutez votre premier lieu de remplacement pour commencer
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Ajouter un cabinet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lieux.map((lieu, index) => (
            <div 
              key={lieu.id} 
              className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:shadow-card-hover animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg"
                    style={{ backgroundColor: lieu.couleur }}
                  >
                    {lieu.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{lieu.nom}</h3>
                    <p className="text-sm text-muted-foreground">
                      {lieu.pourcentageRetrocession}% rétrocession
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(lieu)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(lieu.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                {lieu.adresse && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{lieu.adresse}</span>
                  </div>
                )}
                {lieu.telephone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <a href={`tel:${lieu.telephone}`} className="hover:text-primary">
                      {lieu.telephone}
                    </a>
                  </div>
                )}
                {lieu.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <a href={`mailto:${lieu.email}`} className="hover:text-primary truncate">
                      {lieu.email}
                    </a>
                  </div>
                )}
              </div>

              {lieu.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground line-clamp-2">{lieu.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
