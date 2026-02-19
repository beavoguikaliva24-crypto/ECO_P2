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
    queryset = TableAffectation.objects.all()
    serializer_class = AffectationSerializer
    # Filtrer les élèves par classe ou année
    filter_backends = [DjangoFilterBackend]
    filterset_fields = [ 'annee_aff', 'classe_aff']

class RecouvrementViewSet(viewsets.ModelViewSet):
    queryset = TableRecouvrement.objects.all()
    serializer_class = RecouvrementSerializer