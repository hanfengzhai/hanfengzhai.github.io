#!/bin/bash	  
#SBATCH -J BAs		 # Job Name
#SBATCH -o BAs.o%j	 # Name of the error and output files (%j appends the jobID)
#SBATCH -N 1             # Requests nodes
#SBATCH -n 32	         # Requests number of tasks, in multiples of 64 
#SBATCH -p development	 # Queue name: development (max 2 hr walltime) or normal
#SBATCH -t 00:30:00	 # Run time (hh:mm:ss) 
#SBATCH -A TG-MPS150006 
set -x	 # Echo commands, use set echo with csh

PREFIX="k8"
PSEUDO_DIR="./pseudo_dir" #Set to your pseudo directory
INFILE="$PREFIX.in"
OUTFILE="$PREFIX.out"

cat > $INFILE << EOF
&CONTROL
 calculation = 'scf',
 restart_mode = 'from_scratch',
 prefix='$PREFIX',
 pseudo_dir='$PSEUDO_DIR',
 tstress=.true.,
 tprnfor=.true.,
/
&SYSTEM
 ibrav=2,
 celldm(1)=9.d0,
 nat=2,
 ntyp=2,
 ecutwfc=50,
 ecutrho=600,
 occupations = 'fixed',
 use_all_frac = .true.,
/
&ELECTRONS
 conv_thr = 1.0D-8,
 mixing_mode = 'plain',
 mixing_beta = 0.7d0,
 diagonalization = 'cg',
/
&IONS
 ion_dynamics='bfgs',
/
&CELL
 cell_dynamics = 'bfgs',
 press=0.1d0,
/
ATOMIC_SPECIES
 B  10.811d0 B_LDA.UPF
 As 74.9216d0 As_LDA.UPF

ATOMIC_POSITIONS crystal
 B  0.d0 0.d0 0.d0
 As 0.25d0 0.25d0 0.25d0

K_POINTS automatic
  8 8 8 0 0 0

EOF

# module load qe
# module load spider qe

module load intel/19.1.1
module load impi/19.0.7
module load mvapich2/2.3.6
module load qe/7.0

# ibrun pw.x < $INFILE > $OUTFILE # Run the executable named pw.x 
pw.x < $INFILE > $OUTFILE # Run the executable named pw.x 


rm *.igk *.wfc* *.xml
rm -r *.save

