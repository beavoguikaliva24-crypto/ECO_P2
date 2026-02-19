from rest_framework import serializers
from .models import *

class AnneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableAnnee
        fields = '__all__'

class NiveauSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableNiveau
        fields = '__all__'

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableOption
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TableRole
        fields = '__all__'

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TablePermission
        fields = '__all__'

class UtilisateurSerializer(serializers.ModelSerializer):
    role_nom = serializers.ReadOnlyField(source='role.role')
    
    class Meta:
        model = TableUtilisateur
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}} # Sécurité : ne jamais renvoyer le mdp

class EleveSerializer(serializers.ModelSerializer):
    # Les champs calculés (fullname, date_naissance) sont automatiquement inclus 
    # car ils sont définis dans le save() ou comme propriétés
    class Meta:
        model = TableEleve
        fields = '__all__'
        read_only_fields = ('matricule', 'fullname', 'date_naissance')

class ClasseSerializer(serializers.ModelSerializer):
    # Pour afficher le nom dans le JSON
    niveau_nom = serializers.ReadOnlyField(source='niveau_classe.niveau')
    option_nom = serializers.ReadOnlyField(source='option_classe.option')

    class Meta:
        model = TableClasse
        fields = ['id', 'code_classe', 'lib_classe', 'niveau_classe', 'option_classe', 'niveau_nom', 'option_nom']

class FraisScolariteSerializer(serializers.ModelSerializer):
    classe_libelle = serializers.ReadOnlyField(source='classe_fs.lib_classe')
    annee_libelle = serializers.ReadOnlyField(source='annee_fs.annee_scolaire')

    class Meta:
        model = TableFraisScolarite
        fields = '__all__'

class AffectationSerializer(serializers.ModelSerializer):
    eleve_details = EleveSerializer(source='eleve_aff', read_only=True)
    classe_nom = serializers.ReadOnlyField(source='classe_aff.lib_classe')
    annee_nom = serializers.ReadOnlyField(source='annee_aff.annee_scolaire')

    class Meta:
        model = TableAffectation
        fields = '__all__'

class RecouvrementSerializer(serializers.ModelSerializer):
    # Informations imbriquées pour faciliter l'affichage des reçus dans Next.js
    info_eleve = serializers.ReadOnlyField(source='affectation.eleve_aff.fullname')
    info_matricule = serializers.ReadOnlyField(source='affectation.eleve_aff.matricule')
    info_classe = serializers.ReadOnlyField(source='affectation.classe_aff.lib_classe')

    class Meta:
        model = TableRecouvrement
        fields = '__all__'
        read_only_fields = ('total_paye', 'frais_paiement', 'tranche1_paiement', 'tranche2_paiement', 'tranche3_paiement')