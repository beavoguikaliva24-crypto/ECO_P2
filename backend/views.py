from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, filters,status
from django.contrib.auth.hashers import check_password
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import *
from .serializers import *
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
# views.py
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.db.models.functions import Coalesce

def _to_int(x):
    try:
        return int(x or 0)
    except Exception:
        # Decimal -> int, str -> int si possible
        try:
            return int(Decimal(x))
        except Exception:
            return 0


def _apply_filters_aff(qs, params):
    """
    Filtres pour Affectations :
    - annee (id entier OU texte ex. '2025-2026')
    - classe (id entier OU libellé)
    - niveau (code ex. 'clg', 'pri', ...)
    - option (code ex. 'sm', 'se', ...)
    """
    annee = params.get("annee")
    classe = params.get("classe")
    niveau = params.get("niveau")
    option = params.get("option")

    if annee:
        if str(annee).isdigit():
            qs = qs.filter(annee_aff_id=int(annee))
        else:
            qs = qs.filter(annee_aff__annee_scolaire=annee)

    if classe:
        if str(classe).isdigit():
            qs = qs.filter(classe_aff_id=int(classe))
        else:
            qs = qs.filter(classe_aff__lib_classe=classe)

    if niveau:
        qs = qs.filter(classe_aff__niveau_classe=niveau)

    if option:
        qs = qs.filter(classe_aff__option_classe=option)

    return qs


def _apply_filters_rec(qs, params):
    """
    Filtres pour Recouvrements (en passant par l'affectation liée)
    """
    annee = params.get("annee")
    classe = params.get("classe")
    niveau = params.get("niveau")
    option = params.get("option")

    if annee:
        if str(annee).isdigit():
            qs = qs.filter(affectation__annee_aff_id=int(annee))
        else:
            qs = qs.filter(affectation__annee_aff__annee_scolaire=annee)

    if classe:
        if str(classe).isdigit():
            qs = qs.filter(affectation__classe_aff_id=int(classe))
        else:
            qs = qs.filter(affectation__classe_aff__lib_classe=classe)

    if niveau:
        qs = qs.filter(affectation__classe_aff__niveau_classe=niveau)

    if option:
        qs = qs.filter(affectation__classe_aff__option_classe=option)

    return qs


class StatsRecouvrementAPIView(APIView):
    """
    GET /api/stats/recouvrement/?annee=2025-2026&classe=4ème A&niveau=clg&option=sm

    Retourne :
    - totaux globaux (sans filtre)
    - totaux filtrés
    - stats (payé, restant)
    - répartitions (classe, niveau, option)
    """

    permission_classes = [permissions.IsAuthenticated]  # ajuste selon ton projet

    def get(self, request, *args, **kwargs):
        params = request.query_params

        # --- QuerySets de base
        qs_aff_all = TableAffectation.objects.all()
        qs_rec_all = TableRecouvrement.objects.all()

        # --- Totaux globaux (sans filtre)
        total_affectations_global = qs_aff_all.values("id").distinct().count()
        total_recouvrements_global = qs_rec_all.values("id").distinct().count()

        # --- Application des filtres
        qs_aff = _apply_filters_aff(qs_aff_all, params)
        qs_rec = _apply_filters_rec(qs_rec_all, params)

        # --- Comptages DISTINCT
        nb_affectes_filtre = qs_aff.values("id").distinct().count()
        nb_recouv_filtre = qs_rec.values("affectation_id").distinct().count()

        # --- Agrégations monétaires (filtres appliqués)
        agg_rec = qs_rec.aggregate(
            frais=Coalesce(Sum("frais_paiement"), 0),
            paye=Coalesce(Sum("total_paye"), 0),
        )
        total_frais = _to_int(agg_rec["frais"])
        total_paye = _to_int(agg_rec["paye"])
        total_restant = max(0, total_frais - total_paye)

        pct_paye = float((total_paye / total_frais) * 100) if total_frais > 0 else 0.0
        pct_restant = float((total_restant / total_frais) * 100) if total_frais > 0 else 0.0

        # --- Par classe (empilé payé / restant)
        # group by libellé de classe
        par_classe_rows = (
            qs_rec
            .values("affectation__classe_aff__lib_classe")
            .annotate(
                total_frais=Coalesce(Sum("frais_paiement"), 0),
                total_paye=Coalesce(Sum("total_paye"), 0),
            )
            .order_by("affectation__classe_aff__lib_classe")
        )

        par_classe = []
        for r in par_classe_rows:
            name = r["affectation__classe_aff__lib_classe"] or "N/A"
            paye = _to_int(r["total_paye"])
            frais = _to_int(r["total_frais"])
            restant = max(0, frais - paye)
            par_classe.append({
                "name": name,
                "paye": paye,
                "restant": restant,
                "total": frais,
            })

        # --- Par niveau : nb dossiers avec paiement > 0
        par_niveau_rows = (
            qs_rec
            .values("affectation__classe_aff__niveau_classe")
            .annotate(nb=Count("id", filter=Q(total_paye__gt=0)))
            .order_by("affectation__classe_aff__niveau_classe")
        )
        par_niveau = [
            {
                "name": r["affectation__classe_aff__niveau_classe"] or "N/A",
                "total": r["nb"] or 0,
            }
            for r in par_niveau_rows
        ]

        # --- Par option : nb dossiers avec paiement > 0
        par_option_rows = (
            qs_rec
            .values("affectation__classe_aff__option_classe")
            .annotate(nb=Count("id", filter=Q(total_paye__gt=0)))
            .order_by("affectation__classe_aff__option_classe")
        )
        par_option = [
            {
                "name": r["affectation__classe_aff__option_classe"] or "N/A",
                "total": r["nb"] or 0,
            }
            for r in par_option_rows
        ]

        data = {
            # --- Totaux globaux (sans filtre)
            "total_affectations": total_affectations_global,
            "total_recouvrements": total_recouvrements_global,

            # --- Totaux filtrés
            "nb_affectes_filtre": nb_affectes_filtre,     # ← Doit pouvoir afficher 27 si filtres larges
            "nb_recouv_filtre": nb_recouv_filtre,

            # --- Montants filtrés
            "total_frais": total_frais,
            "total_paye": total_paye,
            "total_restant": total_restant,
            "pct_paye": round(pct_paye, 1),
            "pct_restant": round(pct_restant, 1),

            # --- Répartitions
            "par_classe": par_classe,
            "par_niveau": par_niveau,
            "par_option": par_option,
        }

        return Response(data, status=status.HTTP_200_OK)

class LoginView(APIView):
    # On autorise tout le monde à essayer de se connecter
    permission_classes = [AllowAny] 

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            user = TableUtilisateur.objects.get(username=username)
            print(f"Utilisateur trouvé : {user.username}") # DEBUG

            is_correct = check_password(password, user.password)
            print(f"Mot de passe valide ? {is_correct}") # DEBUG

            if is_correct:
                if user.statut == 'Off':
                    return Response({"error": "Compte désactivé"}, status=status.HTTP_403_FORBIDDEN)
                
                # Mise à jour de la date de connexion
                user.derniereconnection = timezone.now()
                user.save(update_fields=['derniereconnection'])

                # On prépare uniquement les données de profil
                user_data = {
                    "id": user.id,
                    "username": user.username,
                    "fullname": f"{user.prenom} {user.nom}",
                    "role": user.role.role if user.role else "Utilisateur",
                    "photo": request.build_absolute_uri(user.photo.url) if user.photo else None
                }

                # On renvoie juste l'utilisateur, pas de tokens !
                return Response({
                    "user": user_data,
                    "message": "Connexion réussie"
                }, status=status.HTTP_200_OK)
            
            # Si le mot de passe est faux
            return Response({"error": "Identifiants incorrects"}, status=status.HTTP_401_UNAUTHORIZED)
            
        except TableUtilisateur.DoesNotExist:
            return Response({"error": "Utilisateur introuvable"}, status=status.HTTP_401_UNAUTHORIZED)

# Utilisation de ModelViewSet pour gérer automatiquement le CRUD
class AnneeViewSet(viewsets.ModelViewSet):
    queryset = TableAnnee.objects.all()
    serializer_class = AnneeSerializer

class NiveauViewSet(viewsets.ModelViewSet):
    queryset = TableNiveau.objects.all()
    serializer_class = NiveauSerializer

class OptionViewSet(viewsets.ModelViewSet):
    queryset = TableOption.objects.all()
    serializer_class = OptionSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = TableRole.objects.all()
    serializer_class = RoleSerializer

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = TablePermission.objects.all()
    serializer_class = PermissionSerializer

class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = TableUtilisateur.objects.all()
    serializer_class = UtilisateurSerializer

class EleveViewSet(viewsets.ModelViewSet):
    queryset = TableEleve.objects.all()
    serializer_class = EleveSerializer
    # C'EST CETTE LIGNE QUI PERMET D'ENREGISTRER SANS TOKEN :
    permission_classes = [permissions.AllowAny]
    # Ajout de recherche par nom ou matricule
    filter_backends = [filters.SearchFilter]
    # 2. On définit les champs sur lesquels on peut chercher
    # Le '^' signifie "commence par", le '@' est pour la recherche plein texte
    search_fields = ['fullname', 'matricule']

class ClasseViewSet(viewsets.ModelViewSet):
    queryset = TableClasse.objects.all()
    serializer_class = ClasseSerializer
    search_fields = ['code_classe', 'lib_classe']

class FraisScolariteViewSet(viewsets.ModelViewSet):
    queryset = TableFraisScolarite.objects.all()
    serializer_class = FraisScolariteSerializer

class AffectationViewSet(viewsets.ModelViewSet):
    queryset = TableAffectation.objects.all().order_by('id')
    serializer_class = AffectationSerializer
    filterset_fields = ['eleve_aff', 'classe_aff', 'annee_aff']

    @action(detail=False, methods=['post'])
    def ensure(self, request):
        eleve = request.data.get('eleve_aff')
        classe = request.data.get('classe_aff')
        annee = request.data.get('annee_aff')
        etat = request.data.get('etat_aff', 'Nouv')
        if not (eleve and classe and annee):
            return Response({"detail": "eleve_aff, classe_aff, annee_aff requis"}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = TableAffectation.objects.get_or_create(
            eleve_aff_id=eleve, classe_aff_id=classe, annee_aff_id=annee,
            defaults={'etat_aff': etat}
        )
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class RecouvrementViewSet(viewsets.ModelViewSet):
    queryset = TableRecouvrement.objects.all().order_by('id')
    serializer_class = RecouvrementSerializer
    filterset_fields = ['affectation']  # si django-filter activé

    @action(detail=False, methods=['post'])
    def ensure(self, request):
        aff_id = request.data.get('affectation')
        if not aff_id:
            return Response({"detail": "affectation est requis"}, status=status.HTTP_400_BAD_REQUEST)
        rec, created = TableRecouvrement.objects.get_or_create(affectation_id=aff_id)
        return Response(self.get_serializer(rec).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
